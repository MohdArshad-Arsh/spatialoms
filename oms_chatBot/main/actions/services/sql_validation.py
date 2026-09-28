import re
from difflib import SequenceMatcher
from pathlib import Path


class validateQuery():
    TABLE_MATCH_THRESHOLD = 0.75
    TABLE_MATCH_MARGIN = 0.08
    COLUMN_MATCH_THRESHOLD = 0.85
    COLUMN_MATCH_AMBIGUITY_MARGIN = 0.05

    TABLE_ALIASES = {
        "order": "order_tbl",
        "orders": "order_tbl",
        "order_table": "order_tbl",
        "order_event": "order_events",
        "order_history": "order_events",
        "events": "order_events",
        "vendor": "vendor_tbl",
        "vendors": "vendor_tbl",
        "sensor": "sensor_tbl",
        "sensors": "sensor_tbl",
        "client": "client_tbl",
        "clients": "client_tbl",
        "aoi": "aoi_tbl",
        "user": "users",
    }

    COLUMN_ALIASES = {
        "client": "client_name",
        "clients": "client_name",
        "customer": "client_name",
        "customers": "client_name",
        "vendorname": "vendor",
        "provider": "vendor",
        "sensor": "selected_sensor",
        "sensor_name": "selected_sensor",
        "completion": "percentage_completed",
        "totalprice": "total_price",
        "total_price": "total_price",
    }

    BLOCKED_KEYWORDS = {
        "DELETE",
        "DROP",
        "UPDATE",
        "INSERT",
        "ALTER",
        "TRUNCATE",
        "CREATE",
        "REPLACE",
        "GRANT",
        "REVOKE",
    }

    SQL_KEYWORDS = {
        "ALL",
        "AND",
        "AS",
        "ASC",
        "BETWEEN",
        "BY",
        "CASE",
        "DESC",
        "DISTINCT",
        "ELSE",
        "END",
        "FROM",
        "GROUP",
        "HAVING",
        "IN",
        "INNER",
        "INTERVAL",
        "IS",
        "JOIN",
        "LEFT",
        "LIKE",
        "LIMIT",
        "NOT",
        "NULL",
        "ON",
        "OR",
        "ORDER",
        "OUTER",
        "RIGHT",
        "SELECT",
        "THEN",
        "WHERE",
        "WHEN",
        "WITH",
    }

    SQL_FUNCTIONS = {
        "AVG",
        "COALESCE",
        "COUNT",
        "CURDATE",
        "DATE",
        "DATE_ADD",
        "DATE_SUB",
        "DAY",
        "LOWER",
        "MAX",
        "MIN",
        "MONTH",
        "NOW",
        "SUM",
        "UPPER",
        "WEEK",
        "YEAR",
    }

    CLAUSE_KEYWORDS = {
        "WHERE",
        "JOIN",
        "INNER",
        "LEFT",
        "RIGHT",
        "FULL",
        "CROSS",
        "ON",
        "GROUP",
        "ORDER",
        "HAVING",
        "LIMIT",
        "UNION",
    }

    def __init__(self, query):
        self.query = query
        self.last_error = None

    def validate(self) -> str | None:
        status, query_or_error = self.extract_sql(self.query)
        if not status:
            return self._fail(query_or_error)

        query = query_or_error

        status, error = self.validate_sql_safety(query)
        if not status:
            return self._fail(error)

        status, query_or_error = self.validate_and_correct_tables(query)
        if not status:
            return self._fail(query_or_error)

        query = query_or_error

        status, query_or_error = self.validate_and_correct_columns(query)
        if not status:
            return self._fail(query_or_error)

        query = query_or_error

        status, error = self.validate_columns(query)
        if not status:
            return self._fail(error)

        print(True, "Valid Query")
        return query

    def _fail(self, error: str) -> None:
        self.last_error = error
        print(False, error)
        return None

    def extract_sql(self, llm_output: str) -> tuple[bool, str]:
        response = llm_output.strip()
        response = re.sub(r"```sql", "", response, flags=re.IGNORECASE)
        response = response.replace("```", "")

        masked_response = self._mask_non_code(response)
        start_match = re.search(r"\b(?:SELECT|WITH)\b", masked_response, re.IGNORECASE)
        if not start_match:
            return False, "Unable to extract SQL"

        statement_end = masked_response.find(";", start_match.start())
        if statement_end == -1:
            trailing_match = re.search(
                r"(?im)^\s*(?:---+|#{1,6}\s+|"
                r"(?:ANSWER|NOTE|EXPLANATION|CONVERSATION\s+HISTORY)\s*:)",
                masked_response[start_match.end():],
            )
            if not trailing_match:
                return False, "Unable to extract SQL"

            statement_end = start_match.end() + trailing_match.start()
            sql = response[start_match.start():statement_end].strip().rstrip(";")
            return True, f"{sql};"

        sql = response[start_match.start():statement_end + 1].strip()
        return True, sql

    def validate_sql_safety(self, query: str) -> tuple[bool, str]:
        masked_query = self._mask_non_code(query)
        sql_upper = masked_query.strip().upper()

        if not re.match(r"^(SELECT|WITH)\b", sql_upper):
            return False, "Only SELECT or WITH queries are allowed"

        for keyword in self.BLOCKED_KEYWORDS:
            if re.search(rf"\b{keyword}\b", sql_upper):
                return False, f"Blocked keyword detected: {keyword}"

        return True, "Valid Query"

    def validate_and_correct_tables(self, query: str) -> tuple[bool, str]:
        table_schemas = self.get_table_schemas()
        allowed_tables = set(table_schemas.keys())
        cte_names = self._collect_cte_names(self._mask_non_code(query))

        if not allowed_tables:
            return False, "No schema table metadata is available"

        masked_query = self._mask_non_code(query)
        references = self._find_table_references(masked_query)
        if not references:
            return False, "No table found in query"

        replacements = []
        for reference in references:
            table_name = reference["table"].lower()

            if table_name in allowed_tables or table_name in cte_names:
                continue

            corrected_table = self._closest_table(table_name, allowed_tables)
            if corrected_table is None:
                return False, f"Unknown table {table_name}"

            replacements.append(
                (reference["start"], reference["end"], corrected_table)
            )

        corrected_query = query
        for start, end, corrected_table in reversed(replacements):
            corrected_query = (
                corrected_query[:start] + corrected_table + corrected_query[end:]
            )

        return True, corrected_query

    def validate_and_correct_columns(self, query: str) -> tuple[bool, str]:
        status, issues_or_error = self._find_column_issues(query)
        if not status:
            return False, issues_or_error

        issues = issues_or_error
        if not issues:
            return True, query

        table_names = {issue["table"] for issue in issues}
        if len(table_names) != 1:
            return False, "Column auto-correction requires exactly one table"

        table_name = next(iter(table_names))
        table_schemas = self.get_table_schemas()
        allowed_columns = table_schemas.get(table_name, set())
        replacements = []

        for issue in issues:
            invalid_column = issue["column"]
            correction_status, corrected_column_or_error = self._correct_column(
                invalid_column,
                allowed_columns,
            )
            if not correction_status:
                return False, corrected_column_or_error

            corrected_column = corrected_column_or_error
            print("Auto-corrected column:")
            print(f"{invalid_column} -> {corrected_column}")
            replacements.append((issue["start"], issue["end"], corrected_column))

        corrected_query = query
        for start, end, corrected_column in reversed(replacements):
            corrected_query = (
                corrected_query[:start] + corrected_column + corrected_query[end:]
            )

        return True, corrected_query

    def validate_columns(self, query: str) -> tuple[bool, str]:
        status, issues_or_error = self._find_column_issues(query)
        if not status:
            return False, issues_or_error

        issues = issues_or_error
        if issues:
            issue = issues[0]
            return (
                False,
                f"Unknown column {issue['column']} for table {issue['table']}",
            )

        return True, "Valid Query"

    def _find_column_issues(self, query: str) -> tuple[bool, list[dict[str, object]] | str]:
        table_schemas = self.get_table_schemas()
        masked_query = self._mask_non_code(query)
        cte_names = self._collect_cte_names(masked_query)
        table_references = self._build_table_reference_map(
            masked_query,
            table_schemas,
            cte_names,
        )

        if not table_references:
            return False, "No table found in query"

        alias_map = {
            reference["name"]: reference["table"]
            for reference in table_references
        }
        referenced_tables = {reference["table"] for reference in table_references}
        allowed_columns = self._allowed_columns_for_tables(
            referenced_tables,
            table_schemas,
        )
        select_aliases = self._collect_select_aliases(masked_query)
        skip_spans = self._non_column_spans(masked_query)
        issues = []

        qualified_pattern = re.compile(
            r"`?(?P<qualifier>[A-Za-z_][A-Za-z0-9_]*)`?\s*\.\s*"
            r"`?(?P<column>[A-Za-z_][A-Za-z0-9_]*)`?",
            flags=re.IGNORECASE,
        )
        qualified_column_spans = []

        for match in qualified_pattern.finditer(masked_query):
            qualifier = match.group("qualifier").lower()
            column = match.group("column").lower()
            qualified_column_spans.append(match.span())

            if self._span_is_inside(match.span(), skip_spans):
                continue

            if qualifier not in alias_map:
                return False, f"Unknown alias {qualifier}"

            table_name = alias_map[qualifier]
            if column not in table_schemas.get(table_name, set()):
                issues.append(
                    {
                        "column": column,
                        "table": table_name,
                        "start": match.start("column"),
                        "end": match.end("column"),
                    }
                )

        identifier_pattern = re.compile(r"`?(?P<name>[A-Za-z_][A-Za-z0-9_]*)`?")
        known_names = (
            set(alias_map.keys())
            | referenced_tables
            | cte_names
            | select_aliases
            | {"true", "false"}
        )

        for match in identifier_pattern.finditer(masked_query):
            name = match.group("name").lower()
            span = match.span()

            if self._span_is_inside(span, skip_spans):
                continue
            if self._span_is_inside(span, qualified_column_spans):
                continue
            if self._is_known_sql_token(name, masked_query[match.end():]):
                continue
            if name in known_names:
                continue
            if name not in allowed_columns:
                if len(referenced_tables) == 1:
                    table_name = next(iter(referenced_tables))
                    issues.append(
                        {
                            "column": name,
                            "table": table_name,
                            "start": match.start("name"),
                            "end": match.end("name"),
                        }
                    )
                    continue

                return False, f"Unknown column {name}"

        return True, issues

    def get_allowed_tables(self) -> set[str]:
        return set(self.get_table_schemas().keys())

    def get_table_schemas(self) -> dict[str, set[str]]:
        metadata_dir = Path(__file__).resolve().parent / "metadata"
        table_schemas = {}

        for metadata_file in metadata_dir.glob("*.md"):
            content = metadata_file.read_text(encoding="utf-8")
            table_match = re.search(
                r"^\s*#\s*Table:\s*`?([A-Za-z_][A-Za-z0-9_]*)`?\s*$",
                content,
                flags=re.IGNORECASE | re.MULTILINE,
            )
            if table_match:
                table_schemas[table_match.group(1).lower()] = (
                    self._extract_columns(content)
                )

        return table_schemas

    def _extract_columns(self, metadata_content: str) -> set[str]:
        columns = set()
        for section_name in ("Columns", "Example Records"):
            section_match = re.search(
                rf"^\s*##\s*{section_name}\s*$"
                r"(?P<section>.*?)"
                r"(?=^\s*##\s|\Z)",
                metadata_content,
                flags=re.IGNORECASE | re.MULTILINE | re.DOTALL,
            )
            if section_match:
                columns.update(
                    self._extract_markdown_table_columns(
                        section_match.group("section")
                    )
                )

        return columns

    def _extract_markdown_table_columns(self, markdown: str) -> set[str]:
        header = None
        columns = set()

        for line in markdown.splitlines():
            stripped = line.strip()
            if not stripped.startswith("|"):
                continue

            cells = [
                cell.strip().strip("`").lower()
                for cell in stripped.strip("|").split("|")
            ]

            if not cells:
                continue
            if all(re.fullmatch(r"-+", cell) for cell in cells):
                continue

            if header is None:
                header = cells
                continue

            if header[0] == "column":
                column_name = cells[0]
                if self._is_identifier(column_name):
                    columns.add(column_name)
                continue

            return {cell for cell in header if self._is_identifier(cell)}

        return columns

    def _find_table_references(self, masked_query: str) -> list[dict[str, object]]:
        table_pattern = re.compile(
            r"\b(?:FROM|JOIN)\s+"
            r"(?P<quote>`?)"
            r"(?P<table>[A-Za-z_][A-Za-z0-9_]*)"
            r"(?P=quote)"
            r"(?:\s+(?:AS\s+)?(?P<alias>`?[A-Za-z_][A-Za-z0-9_]*`?))?",
            flags=re.IGNORECASE,
        )
        references = []

        for match in table_pattern.finditer(masked_query):
            table_name = match.group("table").lower()
            alias = self._clean_identifier(match.group("alias"))

            if alias and alias.upper() in self.CLAUSE_KEYWORDS:
                alias = None

            references.append(
                {
                    "table": table_name,
                    "alias": alias,
                    "start": match.start("table"),
                    "end": match.end("table"),
                }
            )

        return references

    def _build_table_reference_map(
        self,
        masked_query: str,
        table_schemas: dict[str, set[str]],
        cte_names: set[str],
    ) -> list[dict[str, str]]:
        references = []

        for reference in self._find_table_references(masked_query):
            table_name = reference["table"]
            if table_name in cte_names:
                continue
            if table_name not in table_schemas:
                continue

            references.append({"name": table_name, "table": table_name})
            if reference["alias"]:
                references.append(
                    {"name": reference["alias"], "table": table_name}
                )

        return references

    def _collect_cte_names(self, masked_query: str) -> set[str]:
        stripped_query = masked_query.lstrip()
        if not re.match(r"WITH\b", stripped_query, flags=re.IGNORECASE):
            return set()

        cte_names = set()
        for match in re.finditer(
            r"(?:WITH|,)\s+`?(?P<name>[A-Za-z_][A-Za-z0-9_]*)`?\s+AS\s*\(",
            stripped_query,
            flags=re.IGNORECASE,
        ):
            cte_names.add(match.group("name").lower())

        return cte_names

    def _closest_table(self, table_name: str, allowed_tables: set[str]) -> str | None:
        if table_name in self.TABLE_ALIASES:
            alias_match = self.TABLE_ALIASES[table_name]
            if alias_match in allowed_tables:
                return alias_match

        ranked_matches = sorted(
            (
                (SequenceMatcher(None, table_name, candidate).ratio(), candidate)
                for candidate in allowed_tables
            ),
            reverse=True,
        )
        if not ranked_matches:
            return None

        best_score, best_match = ranked_matches[0]
        second_score = ranked_matches[1][0] if len(ranked_matches) > 1 else 0

        if (
            best_score >= self.TABLE_MATCH_THRESHOLD
            and best_score - second_score >= self.TABLE_MATCH_MARGIN
        ):
            return best_match

        return None

    def _correct_column(
        self,
        column_name: str,
        allowed_columns: set[str],
    ) -> tuple[bool, str]:
        if column_name in allowed_columns:
            return True, column_name

        alias_match = self.COLUMN_ALIASES.get(column_name)
        if alias_match in allowed_columns:
            return True, alias_match

        ranked_matches = sorted(
            (
                (self._column_similarity(column_name, candidate), candidate)
                for candidate in allowed_columns
            ),
            reverse=True,
        )
        strong_matches = [
            (score, candidate)
            for score, candidate in ranked_matches
            if score >= self.COLUMN_MATCH_THRESHOLD
        ]

        if not strong_matches:
            return False, f"Unknown column {column_name}"

        best_score, best_match = strong_matches[0]
        ambiguous_matches = [
            candidate
            for score, candidate in strong_matches
            if best_score - score <= self.COLUMN_MATCH_AMBIGUITY_MARGIN
        ]

        if len(ambiguous_matches) > 1:
            print("Ambiguous column:")
            print(column_name)
            print("Candidates:")
            for candidate in ambiguous_matches:
                print(candidate)
            return False, f"Ambiguous column {column_name}"

        return True, best_match

    def _column_similarity(self, column_name: str, candidate: str) -> float:
        normalized_column = column_name.lower()
        normalized_candidate = candidate.lower()
        score = SequenceMatcher(
            None,
            normalized_column,
            normalized_candidate,
        ).ratio()

        # Handles common LLM expansions like total_price -> price without
        # relaxing ambiguity checks for cases like price -> total_price.
        suffix_pattern = rf"(?:^|_){re.escape(normalized_candidate)}$"
        if re.search(suffix_pattern, normalized_column):
            score = max(score, self.COLUMN_MATCH_THRESHOLD)

        token_pattern = rf"(?:^|_){re.escape(normalized_column)}(?:_|$)"
        if re.search(token_pattern, normalized_candidate):
            score = max(score, self.COLUMN_MATCH_THRESHOLD)

        return score

    def _allowed_columns_for_tables(
        self,
        table_names: set[str],
        table_schemas: dict[str, set[str]],
    ) -> set[str]:
        return {
            column
            for table_name in table_names
            for column in table_schemas.get(table_name, set())
        }

    def _collect_select_aliases(self, masked_query: str) -> set[str]:
        select_match = re.search(r"\bSELECT\b", masked_query, re.IGNORECASE)
        from_match = re.search(r"\bFROM\b", masked_query, re.IGNORECASE)
        if not select_match or not from_match or from_match.start() <= select_match.end():
            return set()

        select_clause = masked_query[select_match.end():from_match.start()]
        return {
            match.group("alias").lower()
            for match in re.finditer(
                r"\bAS\s+`?(?P<alias>[A-Za-z_][A-Za-z0-9_]*)`?",
                select_clause,
                flags=re.IGNORECASE,
            )
        }

    def _non_column_spans(self, masked_query: str) -> list[tuple[int, int]]:
        spans = []
        table_pattern = re.compile(
            r"\b(?:FROM|JOIN)\s+"
            r"`?[A-Za-z_][A-Za-z0-9_]*`?"
            r"(?:\s+(?:AS\s+)?`?[A-Za-z_][A-Za-z0-9_]*`?)?",
            flags=re.IGNORECASE,
        )

        for match in table_pattern.finditer(masked_query):
            spans.append(match.span())

        return spans

    def _is_known_sql_token(self, name: str, trailing_text: str) -> bool:
        upper_name = name.upper()
        if upper_name in self.SQL_KEYWORDS:
            return True
        if upper_name in self.SQL_FUNCTIONS:
            return True
        if trailing_text.lstrip().startswith("("):
            return True

        return False

    def _mask_non_code(self, query: str) -> str:
        pattern = re.compile(
            r"'(?:\\.|''|[^'])*'"
            r'|"(?:\\.|""|[^"])*"'
            r"|--[^\r\n]*"
            r"|#[^\r\n]*"
            r"|/\*.*?\*/",
            flags=re.DOTALL,
        )
        return pattern.sub(lambda match: " " * len(match.group(0)), query)

    def _clean_identifier(self, value: str | None) -> str | None:
        if not value:
            return None

        return value.strip("`").lower()

    def _is_identifier(self, value: str) -> bool:
        return bool(re.fullmatch(r"[a-z_][a-z0-9_]*", value))

    def _span_is_inside(
        self,
        span: tuple[int, int],
        spans: list[tuple[int, int]],
    ) -> bool:
        return any(start <= span[0] and span[1] <= end for start, end in spans)


if __name__ == "__main__":
    validatequery = validateQuery("SELECT count(*) FROM users;")
    value = validatequery.validate()
    print(value)

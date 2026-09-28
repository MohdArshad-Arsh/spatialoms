from actions.services.configurations.db_connection import MySQLService
import os
ACTIONS_DIR = os.path.dirname(os.path.dirname(__file__))




mysqlservices = MySQLService()
sql_prompt = mysqlservices.execute("select prompt from main_prompt where prompt_name = 'sql_prompt';")
sql_prompt = sql_prompt["data"][0]["prompt"]
explaination_prompt = mysqlservices.execute("select prompt from main_prompt where prompt_name = 'explaination_prompt';")
explaination_prompt = explaination_prompt["data"][0]["prompt"]


class promptCration():
    def __init__(self,tables,metadata,question):
        self.tables = tables
        self.metadata = metadata
        self.question = question

    def get_sql_prompt(self,history):
        metadata = ""
        for file_path in self.metadata:
            with open(os.path.join(ACTIONS_DIR,file_path), "r", encoding="utf-8") as file:
                content = file.read()
            metadata = metadata +"\n" + content

        formatted_history = ""

        for _, item in history.items():
            formatted_history += f"""
        user_question :- "{item.get('question', '')}"
        answer :- "{item.get('answer', '')}"
        intent :- "{item.get('intent', '')}"

        """

        prompt = sql_prompt.format(
            tables=self.tables,
            metadata=metadata,
            formatted_history=formatted_history,
            question=self.question
        )

        print("updated prompt for sql generation is :- \n", prompt)

        return prompt
    

    def get_explaination_prompt(self, executed_result):

        result_count = len(executed_result)

        print(f"\n\nEXECUTED RESULT LENGTH IS :- {result_count}\n\n")

        if result_count == 0:

            result_data = "No records found."

        elif result_count <= 10:

            result_data = executed_result

        else:

            sample_records = executed_result[:3]

            status_summary = {}
            priority_summary = {}

            for row in executed_result:

                status = row.get("status")
                priority = row.get("priority")

                if status:
                    status_summary[status] = (
                        status_summary.get(status, 0) + 1
                    )

                if priority:
                    priority_summary[priority] = (
                        priority_summary.get(priority, 0) + 1
                    )

            result_data = f"""
                    Total Records: {result_count}

                    Sample Records:
                    {sample_records}

                    Status Distribution:
                    {status_summary}

                    Priority Distribution:
                    {priority_summary}
                    """
        
        prompt = explaination_prompt.format(
                    question=self.question,
                    result_data=result_data
                )
        # prompt = f"""
        #             You are a business analytics assistant.

        #             Your task is to answer the user's question using the provided result data.

        #             USER QUESTION:
        #             {self.question}

        #             RESULT DATA:
        #             {result_data}

        #             RULES:

        #             1. Answer the user's question directly.
        #             2. Use ONLY the provided result data.
        #             3. Never mention SQL.
        #             4. Never mention databases.
        #             5. Never mention tables, columns, queries, joins, filters, or schema.
        #             6. Never explain how the data was generated.
        #             7. Write the answer in natural business language.
        #             8. If no records are found:
        #             - Clearly state that no matching records were found.
        #             9. If 1-10 records are provided:
        #             - Summarize all relevant records.
        #             10. If more than 10 records exist:
        #             - Mention the total number of records.
        #             - Describe only the sample records.
        #             - Summarize the remaining records.
        #             - Highlight important patterns and trends.
        #             11. If status information exists:
        #             - Summarize the status distribution.
        #             12. If priority information exists:
        #             - Summarize the priority distribution.
        #             13. If price information exists:
        #             - Mention notable price observations.
        #             14. Keep the response concise.
        #             15. Maximum response length: 150 words.
        #             16. Return ONLY the final answer.
        #             17. Do not generate bullet points unless necessary.
        #             18. Respond as if speaking to a business user.
        #             19. Do NOT repeat, rephrase, or restate the user's question.
        #             20. Start directly with the answer.
        #             21. Do not use phrases such as:
        #                 - "The answer is"
        #                 - "Regarding your question"
        #                 - "For your question"
        #                 - "Which orders are pending"
        #                 - "There are X orders that are..."
        #             22. Provide the information directly and naturally.


        #             GOOD EXAMPLE

        #             Question:
        #             Which orders are pending?

        #             Answer:
        #             Order 3 (client: gyufytfyt, organization: Ministry of National Guard) and Order 10 (client: NRSC, organization: NRSC) are currently pending.

        #             BAD EXAMPLE

        #             Question:
        #             Which orders are pending?

        #             Answer:
        #             There are two orders that are pending...

        #             """

        return prompt
            


if __name__ == "__main__":
    history  = {0: {'question': 'how many  users are there?', 'answer': 'There are 3 users.', 'intent': 'users'}, 1: {'question': 'how many  users are there?', 'answer': 'There are 3 users.', 'intent': 'users'}}
    promtcreation = promptCration(tables=None,metadata=["services\\metadata\\orders.md","services\\metadata\\order_events.md"],question=None)
    prompt = promtcreation.get_sql_prompt(history=history)
    print(prompt)

    
        

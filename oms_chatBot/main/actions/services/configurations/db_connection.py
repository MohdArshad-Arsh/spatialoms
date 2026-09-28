import pymysql


class MySQLService:

    def __init__(
        self,
        host="localhost",
        port=3306,
        database="oms_db",
        user="root",
        password="root"
    ):

        self.connection = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            cursorclass=pymysql.cursors.DictCursor
        )

    def execute(self, sql_query):

        cursor = self.connection.cursor()

        try:

            cursor.execute(sql_query)

            if sql_query.strip().upper().startswith("SELECT"):

                result = cursor.fetchall()

                return {
                    "success": True,
                    "data": result
                }

            else:

                self.connection.commit()

                return {
                    "success": True,
                    "message": "Query executed successfully"
                }

        except Exception as e:

            self.connection.rollback()

            return {
                "success": False,
                "error": str(e)
            }

        finally:

            cursor.close()

    def close(self):

        self.connection.close()
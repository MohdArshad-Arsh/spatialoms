from actions.services.configurations.db_connection import MySQLService

class intendDistributionMetadata():
    def __init__(self,intent,query):
        self.intent = intent
        self.query = query
    
    def get_metadata(self):
        if self.intent == "order":
            pass

# RIGHT NOW METDA DETA IS GOING FROM .MD FILES











# db = MySQLService()

# result = db.execute("""
# SELECT *
# FROM order_tbl
# LIMIT 5
# """)

# print(result)

# db.close()
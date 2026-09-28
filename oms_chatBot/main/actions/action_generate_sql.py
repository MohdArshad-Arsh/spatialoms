# This files contains your custom actions which can be used to run
# custom Python code.
#
# See this guide on how to implement these action:
# https://rasa.com/docs/rasa/custom-actions


# This is a simple example for a custom action which utters "Hello World!"

from rasa_sdk import Action
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk import Tracker
import requests
import time
import os


from actions.services.prompt import promptCration
from actions.services.sql_validation import validateQuery
from actions.services.configurations.db_connection import MySQLService
from actions.services.conversation import send_and_store
from actions.services.conversation import get_history
from actions.services.conversation import get_previous_intent
import logging

logger = logging.getLogger(__name__)
class ActionGenerateSQL(Action):

    def name(self):
        return "action_generate_sql"

    def run(self, dispatcher, tracker, domain):

        print(f"I am resolving the query for intent {tracker.get_intent_of_latest_message().lower()},  thankyou !")
        print(f" this is the user question :- {tracker.latest_message.get('text')}")
        print(f" this is how much i am confidate about intent :- {tracker.latest_message['intent']['confidence']}")

        intent = tracker.get_intent_of_latest_message().lower()
        user_question = tracker.latest_message.get('text')

        BASE_DIR = os.path.dirname(os.path.dirname(__file__))

        if intent == "follow-up":
            previous_intent = get_previous_intent()
            print("GETTING THE LAST INTENT AS INTENT :- ", previous_intent)

            if previous_intent:
                intent = previous_intent
            else:
                send_and_store(
                    dispatcher,
                    tracker,
                    "Please ask a complete database question before asking a follow-up."
                )
                return []

        try:
            tables = []
            metadata = []
            if intent == "orders":
                tables = ['order_events','order_tbl']
                metadata = ["services\\metadata\\orders.md"]
            elif intent == 'order_events':
                tables = ['order_events']
                metadata = ["services\\metadata\\order_events.md"]
            elif intent == "vendors":
                tables = ['vender_tb']
                metadata = ["services\\metadata\\vendors.md"]
            elif intent == "sensors":
                tables = ['sensor_tb']
                metadata = ["services\\metadata\\sensors.md"]
            elif intent == "users":
                tables = ['users']
                metadata = ["services\\metadata\\users.md"]
            elif intent == "clients":
                tables = ['client_tbl']
                metadata = ["services\\metadata\\clients.md"]
            elif intent == "aoi":
                tables = ['aoi_tbl']
                metadata = ["services\\metadata\\aoi.md"]
            else:
                print("ERROR :- unable to find intent.")
                exit()
        except:
            send_and_store(dispatcher, tracker, "GOT THE ERROR IN INTENT VARIFICATION AND METADATA CREATION")
            raise

        try:
            promcreation = promptCration(tables=tables,metadata=metadata,question=user_question)
            prompt = promcreation.get_sql_prompt(history=get_history())
            print("GENERATED PROMT IS :- ",prompt)
        except:
            send_and_store(dispatcher, tracker, "GOT THE ERROR IN GETTING THE PROMPT")
            raise

        # The FastAPI service owns ChromaDB and decides whether to call its LLM.
        try:
            start = time.time()
            response = requests.post(
                "http://127.0.0.1:8000/generate-sql",
                json={"prompt": prompt, "question": user_question},
                timeout=600
            )
            print(f"SQL generation took {time.time()-start:.2f} seconds")
            response.raise_for_status()
            sql_response = response.json()
            generated_sql = sql_response["sql"]
            print(
                "SQL CACHE SOURCE :- ",
                sql_response.get("source", "unknown"),
                "| SIMILARITY :- ",
                sql_response.get("similarity", "n/a"),
            )
            print("GENERATED SQL QUERY IS :- ",generated_sql)
        except:
            send_and_store(dispatcher, tracker, "GOT THE ERROR IN SQL GENERATION BY LLM")
            raise

        #query validation and cleaning
        try:
            validatequery = validateQuery(generated_sql)
            validated_sql_query = validatequery.validate()
            print("CLEANED AND VALIDATED QUERY :- ",validated_sql_query)
        except:
            send_and_store(dispatcher, tracker, "GOT THE ERROR IN QUERY VALIDATION")
            raise


        if validated_sql_query != None:
            
            try:
                #executing query
                mysqlservices = MySQLService()
                executed_result = mysqlservices.execute(validated_sql_query)
                if executed_result['success'] == True:
                    print("QUERY EXECUTED AND RESULT IS :- ",executed_result['data'])
                else:
                    send_and_store(dispatcher, tracker, "QUERY EXECUTION FAILD")
                    return []
            except:
                send_and_store(dispatcher, tracker, "GOT THE ERROR IN EXECUTING QUERY")
                return []

            try:
                # Needed for explanation generation even when SQL came from cache.
                promcreation = promptCration(tables=tables,metadata=metadata,question=user_question)
                #result explanation
                prompt_expl = promcreation.get_explaination_prompt(executed_result=executed_result['data'])
                print("GENERATED PROMT FOR EXPLAINATION IS :- ",prompt_expl)
                response = requests.post(
                    "http://127.0.0.1:8000/explian-result",
                    json={
                        "prompt_expl": prompt_expl
                    },
                    timeout=600
                )
                explainations = response.json()["explaination"]
                print("THIS IS THE RESULT EXPLAINATION :- ",explainations)
                send_and_store(dispatcher, tracker, str(explainations))

            except:
                send_and_store(dispatcher, tracker, "GOT THE ERROR IN RESULT EXPLAINATION")
                raise


        return []

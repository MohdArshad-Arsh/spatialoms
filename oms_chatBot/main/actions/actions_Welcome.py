# This files contains your custom actions which can be used to run
# custom Python code.
#
# See this guide on how to implement these action:
# https://rasa.com/docs/rasa/custom-actions


# This is a simple example for a custom action which utters "Hello World!"

from rasa_sdk import Action
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk import Tracker
from actions.services.conversation import send_and_store


class ActionWelcomeUser(Action):

    def name(self):
        return "action_welcome_user"

    def run(self, dispatcher, tracker, domain):

        name = tracker.get_slot("name")
        user_messages = [
            event["text"]
            for event in tracker.events
            if event.get("event") == "user"
        ]

        response = f"Hello {name}, welcome too! {user_messages}"
        send_and_store(dispatcher, tracker, response)

        return []

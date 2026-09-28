questions = []
answer = []
intent_list = []


def store_conversation(question, response, intent):
    questions.append(question)
    answer.append(response)
    intent_list.append(intent)

    print("Questions:", questions)
    print("Answers:", answer)
    print("Intents:", intent_list)


def get_history(limit=3):
    return {
        index: {
            "question": ques,
            "answer": ans,
            "intent": intent
        }
        for index, (ques, ans, intent) in enumerate(
            zip(
                questions[-limit:],
                answer[-limit:],
                intent_list[-limit:]
            )
        )
    }


def get_previous_intent():
    for intent in reversed(intent_list):
        if intent != "follow-up":
            return intent

    return None


def send_and_store(dispatcher, tracker, response):
    question = tracker.latest_message.get("text", "")
    intent = tracker.get_intent_of_latest_message()

    dispatcher.utter_message(text=response)
    store_conversation(question, response, intent)
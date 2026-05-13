from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression
from app.ai_models.nlp.intents import training_data

texts = [t[0] for t in training_data]
labels = [t[1] for t in training_data]

vectorizer = CountVectorizer()
X = vectorizer.fit_transform(texts)

model = LogisticRegression()
model.fit(X, labels)


def predict_intent(message):
    X_test = vectorizer.transform([message])

    prediction = model.predict(X_test)[0]
    probabilities = model.predict_proba(X_test)[0]

    confidence = max(probabilities)

    return prediction, confidence
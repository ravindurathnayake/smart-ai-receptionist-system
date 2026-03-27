from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression
from app.ai_models.recommendation.dataset import data

texts = [d[0] for d in data]
labels = [d[1] for d in data]

vectorizer = CountVectorizer()
X = vectorizer.fit_transform(texts)

model = LogisticRegression()
model.fit(X, labels)


def predict_specialist(message):
    X_test = vectorizer.transform([message])
    prediction = model.predict(X_test)[0]
    probability = max(model.predict_proba(X_test)[0])

    return str(prediction), float(probability)

from app import create_app
from app.models import Queue

app = create_app()
with app.app_context():
    qs = Queue.query.all()
    if not qs:
        print("Queue is empty")
    for q in qs:
        print(f"ID:{q.id}, Num:{q.queue_number}, Status:{q.status}")

from itertools import count

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(title="Pomodoro Task API")

app.add_middleware(
	CORSMiddleware,
	allow_origins=[
		"http://localhost:5173",
		"http://127.0.0.1:5173",
	],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


class TaskCreate(BaseModel):
	title: str


class Task(TaskCreate):
	id: int
	completed: bool = False


tasks: list[Task] = []
task_ids = count(1)


@app.get("/tasks", response_model=list[Task])
def get_tasks() -> list[Task]:
	return tasks


@app.post("/tasks", response_model=Task, status_code=status.HTTP_201_CREATED)
def create_task(task_data: TaskCreate) -> Task:
	task = Task(id=next(task_ids), title=task_data.title)
	tasks.append(task)
	return task


if __name__ == "__main__":
	import uvicorn

	uvicorn.run(app, host="0.0.0.0", port=8000)

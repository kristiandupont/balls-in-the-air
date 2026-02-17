# Balls in the Air

A visual task management tool where tasks grow over time until you "bump" them. Think of it as a live todo list that keeps important recurring tasks visible.

**[Try it live →](https://kristiandupont.github.io/balls-in-the-air/)**

![balls-in-the-air](https://github.com/user-attachments/assets/de2e3290-5dde-4434-aa8f-96c7c27802bc)


## How it works

- Each task is represented as a growing ball
- Tasks grow based on their growth rate (pixels per day)
- Click a task to edit it or "bump" it (reset the timer)
- Drag tasks around the arena
- Tasks bounce off each other using physics simulation

## Development

```bash
npm install
npm run dev
```

## Deployment

The app automatically deploys to GitHub Pages on push to `main`. It's a static frontend-only app built with [Vite](https://vite.dev/) and [Crank.js](https://crank.js.org/).

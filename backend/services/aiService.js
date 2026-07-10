import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

let model = null;

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Gemini initialized successfully");
  } catch (error) {
    console.error("Gemini initialization failed:", error.message);
  }
} else {
  console.log("No valid GEMINI_API_KEY found. Running in mock fallback mode.");
}

function cleanAndParseJSON(text) {
  if (!text) return null;
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```(json)?/, "");
      cleanText = cleanText.replace(/```$/, "");
    }
    cleanText = cleanText.trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON parsing error on string:", text, e);
    return null;
  }
}

export async function generateAIResponse(prompt) {
  if (!model) {
    return null;
  }
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI generation error:", error);
    return null;
  }
}

export async function analyzeTaskBreakdown(
  title,
  description,
  deadline,
  difficulty,
  estimatedDuration
) {
  const prompt = `
You are an AI task breakdown agent. Analyze the following task:
Title: "${title}"
Description: "${description || 'No description provided'}"
Deadline: "${deadline}"
Difficulty: "${difficulty}"
Estimated Duration: ${estimatedDuration} hours

Break this task down into 3-5 subtasks (each subtask should have a 'title' and a 'duration' in minutes). Also write a detailed step-by-step focus plan and a short actionable motivation notification.
Respond ONLY with a JSON object in this exact format:
{
  "subtasks": [
    { "id": "1", "title": "Subtask 1 title", "duration": 30, "completed": false },
    { "id": "2", "title": "Subtask 2 title", "duration": 45, "completed": false }
  ],
  "stepByStepPlan": "Focus plan details...",
  "actionableNotification": "Actionable motivation notification text"
}
`;

  let responseText = null;
  if (model) {
    responseText = await generateAIResponse(prompt);
  }

  const parsed = cleanAndParseJSON(responseText);
  if (parsed && Array.isArray(parsed.subtasks)) {
    return parsed;
  }

  // Smart Mock Fallback Mode
  console.log("Using smart mock fallback for analyzeTaskBreakdown");
  const lowerTitle = title.toLowerCase();
  let subtasks = [];
  
  if (lowerTitle.includes("dsa") || lowerTitle.includes("code") || lowerTitle.includes("program") || lowerTitle.includes("bug") || lowerTitle.includes("develop")) {
    subtasks = [
      { id: "1", title: "Read specifications and sketch diagram", duration: 15, completed: false },
      { id: "2", title: "Implement code architecture & core logic", duration: 45, completed: false },
      { id: "3", title: "Write tests and debug edge cases", duration: 20, completed: false }
    ];
  } else if (lowerTitle.includes("exam") || lowerTitle.includes("study") || lowerTitle.includes("read") || lowerTitle.includes("course") || lowerTitle.includes("learn")) {
    subtasks = [
      { id: "1", title: "Review lectures notes & key concepts", duration: 30, completed: false },
      { id: "2", title: "Solve practice problems / worksheets", duration: 45, completed: false },
      { id: "3", title: "Summarize key terms on cheat sheet", duration: 15, completed: false }
    ];
  } else if (lowerTitle.includes("design") || lowerTitle.includes("wireframe") || lowerTitle.includes("ui") || lowerTitle.includes("figma") || lowerTitle.includes("mockup")) {
    subtasks = [
      { id: "1", title: "Sketch basic layout & flow wireframes", duration: 20, completed: false },
      { id: "2", title: "Select primary color theme & font pairings", duration: 15, completed: false },
      { id: "3", title: "Construct high-fidelity component screens", duration: 55, completed: false }
    ];
  } else {
    subtasks = [
      { id: "1", title: "Gather inputs and reference materials", duration: 10, completed: false },
      { id: "2", title: "Execute core deliverables step by step", duration: 45, completed: false },
      { id: "3", title: "Review outcomes against constraints", duration: 15, completed: false }
    ];
  }

  return {
    subtasks,
    stepByStepPlan: `To finish "${title}" within your ${estimatedDuration}h limit, start with high focus. Turn off notifications. Use 25-minute study sprints with 5-minute walks. Refrain from multi-tasking.`,
    actionableNotification: `Secure a quiet space and start on "${subtasks[0].title}" immediately.`
  };
}

export async function generateRescuePlan(task, procrastinationHistoryCount) {
  const prompt = `
You are an emergency crisis management AI assistant. A user is in "Emergency Rescue Mode" for this task:
Title: "${task.title}"
Description: "${task.description || 'No description provided'}"
Difficulty: "${task.difficulty || 'medium'}"
Estimated Duration: ${task.estimatedDuration || 1} hours
Rescheduled/Procrastinated: ${procrastinationHistoryCount} times

The deadline is extremely close and they are in danger of failing. Create a rescue crash plan omitting non-essentials.
Respond ONLY with a JSON object in this exact format:
{
  "estimatedCompletionChance": 75,
  "warningMessage": "A short crisis warning based on their delay history...",
  "emergencySteps": ["Emergency Step 1", "Emergency Step 2", "Emergency Step 3"],
  "skipItems": ["Ignore item 1", "Ignore item 2"]
}
`;

  let responseText = null;
  if (model) {
    responseText = await generateAIResponse(prompt);
  }

  const parsed = cleanAndParseJSON(responseText);
  if (parsed && parsed.emergencySteps && parsed.skipItems) {
    return parsed;
  }

  // Mock Fallback
  console.log("Using smart mock fallback for generateRescuePlan");
  const completionChance = Math.max(15, 95 - (procrastinationHistoryCount * 12) - (task.difficulty === 'hard' ? 25 : 10));
  
  return {
    estimatedCompletionChance: completionChance,
    warningMessage: `CRITICAL LEVEL: You skipped/ignored scheduled sessions for this task ${procrastinationHistoryCount} times. Emergency Mode has compressed your deliverables.`,
    emergencySteps: [
      "Implement the absolute minimal requirements to satisfy criteria",
      "Deploy basic functions and check connectivity immediately",
      "Avoid all form polish, detailed styling, or advanced logging"
    ],
    skipItems: [
      "Extensive error handling and edge validation",
      "Code commenting and refactoring",
      "Custom responsive visual bells and whistles"
    ]
  };
}

export async function generateVoiceAssistantResponse(query, tasksList) {
  const prompt = `
You are the "Last Minute Life Saver" AI productivity companion. You help the user manage procrastination, prioritize tasks, and stay calm but focused.
Here are the user's pending tasks:
${JSON.stringify(tasksList)}
The current time is ${new Date().toISOString()}.
The user says: "${query}"

Respond to the user's query in a motivational and action-oriented manner. Suggest a navigation shortcut if it helps (e.g. if they ask what to do, suggest tasks view; if they want a schedule, suggest planner).
Respond ONLY with a JSON object in this exact format:
{
  "textResponse": "Motivational text response (max 3 sentences)...",
  "suggestedAction": "view-planner" | "view-tasks" | "none",
  "actionTargetId": "id of the task to focus on, or null"
}
`;

  let responseText = null;
  if (model) {
    responseText = await generateAIResponse(prompt);
  }

  const parsed = cleanAndParseJSON(responseText);
  if (parsed && parsed.textResponse) {
    return parsed;
  }

  // Mock Fallback
  console.log("Using smart mock fallback for generateVoiceAssistantResponse");
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes("what should i do") || lowerQuery.includes("do now") || lowerQuery.includes("urgent") || lowerQuery.includes("priority")) {
    const sorted = [...tasksList].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    const topTask = sorted[0];
    if (topTask) {
      return {
        textResponse: `Your highest risk task is "${topTask.title}" with a priority rating of ${topTask.priorityScore}/100. I suggest you open your Task Manager and tackle it immediately!`,
        suggestedAction: "view-tasks",
        actionTargetId: topTask.id
      };
    } else {
      return {
        textResponse: "You have no outstanding tasks! Everything is complete. Take a well-deserved break!",
        suggestedAction: "none",
        actionTargetId: null
      };
    }
  }

  if (lowerQuery.includes("schedule") || lowerQuery.includes("plan") || lowerQuery.includes("calendar")) {
    return {
      textResponse: "I can create an optimized focus block schedule for you. Head over to the AI Planner page, specify your available hours, and hit generate!",
      suggestedAction: "view-planner",
      actionTargetId: null
    };
  }

  if (lowerQuery.includes("hello") || lowerQuery.includes("hi ") || lowerQuery.includes("hey")) {
    return {
      textResponse: "Hello! I am your Life Saver companion. Ask me 'What should I do now?' or 'Create today's schedule' to get started on your tasks.",
      suggestedAction: "none",
      actionTargetId: null
    };
  }

  return {
    textResponse: "I hear you! Procrastination is tough, but you can overcome it. Break your work into a 15-minute chunk and start now. Would you like me to show your task manager?",
    suggestedAction: "view-tasks",
    actionTargetId: null
  };
}
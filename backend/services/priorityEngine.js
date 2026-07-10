/**
 * Priority Engine for "Last Minute Life Saver"
 * 
 * Computes a dynamic, real-time priority score (0 to 100) using:
 * priorityScore = deadlineUrgency + importance + difficulty + duration + procrastinationHistory
 */

export const calculatePriorityScore = (task) => {
  if (task.status === 'completed') {
    return 0;
  }

  // 1. Deadline Urgency (Max 40 points)
  const now = new Date();
  const deadline = new Date(task.deadline);
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  let urgencyScore = 0;
  if (diffHours < 0) {
    urgencyScore = 40; // Overdue
  } else if (diffHours <= 2) {
    urgencyScore = 40; // Critical (2 hours or less)
  } else if (diffHours <= 6) {
    urgencyScore = 35;
  } else if (diffHours <= 12) {
    urgencyScore = 30;
  } else if (diffHours <= 24) {
    urgencyScore = 25;
  } else if (diffHours <= 48) {
    urgencyScore = 18;
  } else if (diffHours <= 72) {
    urgencyScore = 10;
  } else {
    urgencyScore = 3;
  }

  // 2. Importance Level (Max 20 points)
  let importanceScore = 5;
  const priority = (task.priority || 'medium').toLowerCase();
  if (priority === 'urgent') importanceScore = 20;
  else if (priority === 'high') importanceScore = 15;
  else if (priority === 'medium') importanceScore = 10;
  else if (priority === 'low') importanceScore = 5;

  // 3. Difficulty Level (Max 15 points)
  let difficultyScore = 5;
  const difficulty = (task.difficulty || 'medium').toLowerCase();
  if (difficulty === 'hard') difficultyScore = 15;
  else if (difficulty === 'medium') difficultyScore = 10;
  else if (difficulty === 'easy') difficultyScore = 5;

  // 4. Task Duration (Max 15 points)
  let durationScore = 5;
  const duration = parseFloat(task.estimatedDuration) || 1;
  if (duration >= 8) durationScore = 15;
  else if (duration >= 4) durationScore = 12;
  else if (duration >= 2) durationScore = 8;
  else durationScore = 5;

  // 5. Procrastination History Penalty (Max 10 points)
  // Penalize tasks that have been skipped, rescheduled or ignored
  let procrastinationScore = 0;
  if (Array.isArray(task.procrastinationHistory)) {
    procrastinationScore = Math.min(10, task.procrastinationHistory.length * 2.5);
  }

  // Calculate total score and cap it at 100
  const rawScore = urgencyScore + importanceScore + difficultyScore + durationScore + procrastinationScore;
  const finalScore = Math.min(100, Math.round(rawScore));

  return finalScore;
};

/**
 * Calculates a dynamic risk value (0-100%) for missing the deadline
 */
export const calculateDeadlineRisk = (task) => {
  if (task.status === 'completed') {
    return 0;
  }

  const now = new Date();
  const deadline = new Date(task.deadline);
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) {
    return 100; // Already missed
  }

  const durationHours = parseFloat(task.estimatedDuration) || 1;
  
  // Risk index = ratio of required duration to available time
  // E.g. If task takes 3 hours and we have 3 hours left, it's 100% risk.
  // If task takes 3 hours and we have 6 hours left, it's 50% risk.
  const ratio = durationHours / diffHours;

  let risk = 0;
  if (ratio >= 1) {
    risk = 90 + Math.min(10, (ratio - 1) * 10); // Very high risk
  } else if (ratio >= 0.5) {
    risk = 60 + (ratio - 0.5) * 60; // 60% to 90% risk
  } else if (ratio >= 0.2) {
    risk = 30 + (ratio - 0.2) * 100; // 30% to 60% risk
  } else {
    risk = ratio * 150; // low risk
  }

  // Adjust risk based on difficulty
  const difficulty = (task.difficulty || 'medium').toLowerCase();
  if (difficulty === 'hard') {
    risk += 10;
  } else if (difficulty === 'easy') {
    risk -= 5;
  }

  // Cap risk between 0 and 100
  return Math.max(0, Math.min(100, Math.round(risk)));
};

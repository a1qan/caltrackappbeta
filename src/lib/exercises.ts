import type { Exercise } from "./types";

export const EXERCISES: Exercise[] = [
  // Chest
  { id: "ex-bench", name: "Bench Press", muscleGroup: "Chest",
    description: "Compound barbell push for the chest, shoulders and triceps.",
    instructions: ["Lie flat, grip bar slightly wider than shoulders.", "Unrack and lower bar to mid-chest under control.", "Press up to lockout without flaring elbows."],
    suggestedSets: 4, suggestedReps: "6-10" },
  { id: "ex-incline", name: "Incline Bench Press", muscleGroup: "Chest",
    description: "Upper-chest focused barbell press.",
    instructions: ["Set bench to 30-45°.", "Lower bar to upper chest.", "Drive through chest to press."],
    suggestedSets: 4, suggestedReps: "8-10" },
  { id: "ex-chest-press", name: "Chest Press Machine", muscleGroup: "Chest",
    description: "Machine variation of the chest press.",
    instructions: ["Set seat so handles align with mid-chest.", "Press handles forward fully.", "Control the return."],
    suggestedSets: 3, suggestedReps: "10-12" },
  { id: "ex-pec-deck", name: "Pec Deck", muscleGroup: "Chest",
    description: "Isolation movement for the chest.",
    instructions: ["Set seat so arms are parallel to floor.", "Squeeze handles together at chest.", "Return slowly."],
    suggestedSets: 3, suggestedReps: "12-15" },

  // Back
  { id: "ex-lat-pull", name: "Lat Pulldown", muscleGroup: "Back",
    description: "Vertical pull targeting the lats.",
    instructions: ["Grip bar wider than shoulders.", "Pull bar to upper chest, elbows down.", "Control on the way back."],
    suggestedSets: 4, suggestedReps: "8-12" },
  { id: "ex-seated-row", name: "Seated Row", muscleGroup: "Back",
    description: "Horizontal row for the mid back.",
    instructions: ["Sit tall, slight knee bend.", "Pull handle to lower ribs.", "Squeeze shoulder blades."],
    suggestedSets: 4, suggestedReps: "8-12" },
  { id: "ex-pull-up", name: "Pull-Up", muscleGroup: "Back",
    description: "Bodyweight vertical pull.",
    instructions: ["Hang from bar, overhand grip.", "Pull chin above bar.", "Lower with control."],
    suggestedSets: 4, suggestedReps: "AMRAP" },

  // Legs
  { id: "ex-leg-press", name: "Leg Press", muscleGroup: "Legs",
    description: "Compound press for quads and glutes.",
    instructions: ["Feet shoulder-width on platform.", "Lower to ~90° knee bend.", "Press through mid-foot."],
    suggestedSets: 4, suggestedReps: "8-12" },
  { id: "ex-leg-ext", name: "Leg Extension", muscleGroup: "Legs",
    description: "Quad isolation.",
    instructions: ["Align knees with machine pivot.", "Extend legs fully.", "Lower slowly."],
    suggestedSets: 3, suggestedReps: "10-15" },
  { id: "ex-leg-curl", name: "Leg Curl", muscleGroup: "Legs",
    description: "Hamstring isolation.",
    instructions: ["Adjust pad above ankles.", "Curl heels to glutes.", "Control the return."],
    suggestedSets: 3, suggestedReps: "10-15" },
  { id: "ex-calf-raise", name: "Calf Raise", muscleGroup: "Legs",
    description: "Calf isolation.",
    instructions: ["Stand on edge of step or machine.", "Rise onto toes fully.", "Lower below parallel."],
    suggestedSets: 4, suggestedReps: "12-20" },

  // Shoulders
  { id: "ex-ohp", name: "Shoulder Press", muscleGroup: "Shoulders",
    description: "Overhead press for the delts.",
    instructions: ["Brace core, grip just outside shoulders.", "Press overhead to lockout.", "Lower under control."],
    suggestedSets: 4, suggestedReps: "6-10" },
  { id: "ex-lat-raise", name: "Lateral Raise", muscleGroup: "Shoulders",
    description: "Side delt isolation.",
    instructions: ["Slight forward lean.", "Raise dumbbells to shoulder height.", "Lower slowly."],
    suggestedSets: 3, suggestedReps: "12-15" },
  { id: "ex-rear-fly", name: "Rear Delt Fly", muscleGroup: "Shoulders",
    description: "Rear delt isolation.",
    instructions: ["Hinge forward.", "Open arms back, leading with elbows.", "Squeeze rear delts."],
    suggestedSets: 3, suggestedReps: "12-15" },

  // Arms
  { id: "ex-curl", name: "Bicep Curl", muscleGroup: "Arms",
    description: "Bicep isolation.",
    instructions: ["Elbows pinned to sides.", "Curl weight up.", "Lower under control."],
    suggestedSets: 3, suggestedReps: "10-12" },
  { id: "ex-hammer", name: "Hammer Curl", muscleGroup: "Arms",
    description: "Brachialis and forearm focus.",
    instructions: ["Neutral grip.", "Curl up keeping wrist neutral.", "Lower slowly."],
    suggestedSets: 3, suggestedReps: "10-12" },
  { id: "ex-tri-pd", name: "Tricep Pushdown", muscleGroup: "Arms",
    description: "Cable tricep isolation.",
    instructions: ["Elbows pinned.", "Press handle down to lockout.", "Control the return."],
    suggestedSets: 3, suggestedReps: "10-15" },
  { id: "ex-skull", name: "Skull Crushers", muscleGroup: "Arms",
    description: "Long-head triceps isolation.",
    instructions: ["Lie flat, EZ bar above forehead.", "Lower bar to near forehead.", "Extend back up."],
    suggestedSets: 3, suggestedReps: "8-12" },

  // Core
  { id: "ex-plank", name: "Plank", muscleGroup: "Core",
    description: "Isometric core hold.",
    instructions: ["Forearms under shoulders.", "Brace abs and glutes.", "Hold a straight line."],
    suggestedSets: 3, suggestedReps: "30-60 s" },
  { id: "ex-crunch", name: "Crunches", muscleGroup: "Core",
    description: "Upper abs isolation.",
    instructions: ["Lie back, knees bent.", "Curl chest toward knees.", "Lower with control."],
    suggestedSets: 3, suggestedReps: "15-25" },
  { id: "ex-leg-raise", name: "Leg Raises", muscleGroup: "Core",
    description: "Lower abs.",
    instructions: ["Lie flat, legs straight.", "Raise legs to vertical.", "Lower slowly without arching back."],
    suggestedSets: 3, suggestedReps: "12-15" },
];

export function exercisesByGroup(): Record<string, Exercise[]> {
  const map: Record<string, Exercise[]> = {};
  for (const e of EXERCISES) {
    (map[e.muscleGroup] ??= []).push(e);
  }
  return map;
}

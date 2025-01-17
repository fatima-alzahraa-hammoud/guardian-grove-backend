import { ITask } from "../../interfaces/ITask";
import { Family } from "../../models/family.model";
import { User } from "../../models/user.model";

export const getCompletedTasks = async (userId: string): Promise<ITask[]> => {
    const user = await User.findById(userId).populate('goals');
    if (!user) {
        throw new Error("User not found");
    }

    let goals = user.goals;
    const family = await Family.findById(user.familyId).populate('goals');
    if (family) {
        goals = [...goals, ...family.goals];
    }

    // Filter out completed tasks from the user's goals and family goals
    const completedTasks = goals.flatMap(goal => 
        goal.tasks.filter(task => task.isCompleted)
    );

    return completedTasks;
};

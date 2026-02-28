import { useEffect } from "react";
import { useVoiceCommands, VoiceCommand } from "@/contexts/VoiceCommandContext";

/**
 * Hook for registering page-specific voice commands.
 * Commands are automatically unregistered when the component unmounts.
 * 
 * @example
 * usePageVoiceCommands([
 *   {
 *     keywords: ["save recipe", "save"],
 *     action: () => handleSave(),
 *     description: "Save the current recipe",
 *     category: "action",
 *   },
 * ]);
 */
export const usePageVoiceCommands = (commands: VoiceCommand[]) => {
  const { registerCommands, unregisterCommands } = useVoiceCommands();

  useEffect(() => {
    if (commands.length === 0) return;

    registerCommands(commands);

    // Cleanup: unregister all commands when component unmounts
    return () => {
      const allKeywords = commands.flatMap(cmd => cmd.keywords);
      unregisterCommands(allKeywords);
    };
  }, [commands, registerCommands, unregisterCommands]);
};

/**
 * Hook for triggering actions via voice on specific elements.
 * Returns handlers that can be attached to buttons/interactive elements.
 */
export const useVoiceAction = (keywords: string[], description: string) => {
  const { registerCommands, unregisterCommands } = useVoiceCommands();

  const register = (action: () => void) => {
    const command: VoiceCommand = {
      keywords,
      action,
      description,
      category: "action",
    };
    registerCommands([command]);
    
    return () => unregisterCommands(keywords);
  };

  return { register };
};

export default usePageVoiceCommands;

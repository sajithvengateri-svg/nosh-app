import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, HelpCircle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVoiceCommands } from "@/contexts/VoiceCommandContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export const FloatingVoiceMic = () => {
  const { 
    isListening, 
    transcript, 
    toggleListening, 
    availableCommands, 
    lastCommand,
    isSupported 
  } = useVoiceCommands();
  
  const [showHelp, setShowHelp] = useState(false);

  if (!isSupported) {
    return null;
  }

  if (!isSupported) {
    return null;
  }

  // Group commands by category
  const commandsByCategory = availableCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    // Only add unique descriptions
    if (!acc[cmd.category].some(c => c.description === cmd.description)) {
      acc[cmd.category].push(cmd);
    }
    return acc;
  }, {} as Record<string, typeof availableCommands>);

  const categoryLabels: Record<string, string> = {
    navigation: "🧭 Navigation",
    action: "⚡ Actions",
    data: "📝 Data Entry",
    ui: "🖥️ UI Controls",
  };

  return (
    <motion.div
      className="fixed bottom-24 right-4 z-50 md:bottom-8 md:right-8"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
    >
      <div className="flex flex-col items-end gap-2">
        {/* Transcript display when listening */}
        <AnimatePresence>
          {isListening && transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="bg-card border border-border rounded-lg px-4 py-2 shadow-lg max-w-[250px]"
            >
              <p className="text-sm text-muted-foreground">Hearing:</p>
              <p className="text-sm font-medium truncate">{transcript}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last command feedback */}
        <AnimatePresence>
          {lastCommand && !isListening && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 text-xs text-primary max-w-[200px]"
            >
              <span className="truncate block">✓ {lastCommand}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help button - always visible */}
        <Popover open={showHelp} onOpenChange={setShowHelp}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 bg-card shadow-md"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            side="left" 
            align="end" 
            className="w-80 p-0"
          >
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" />
                Voice Commands
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tap the mic and say any of these commands
              </p>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="p-4 space-y-4">
                {Object.entries(commandsByCategory).map(([category, commands]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium mb-2">
                      {categoryLabels[category] || category}
                    </h4>
                    <div className="space-y-1">
                      {commands.slice(0, 8).map((cmd, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Badge variant="secondary" className="text-xs shrink-0">
                            "{cmd.keywords[0]}"
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {cmd.description}
                          </span>
                        </div>
                      ))}
                      {commands.length > 8 && (
                        <p className="text-xs text-muted-foreground italic">
                          +{commands.length - 8} more commands...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Main mic button - always visible */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="icon"
            className={cn(
              "rounded-full h-14 w-14 shadow-lg transition-all duration-300",
              isListening 
                ? "bg-primary voice-active" 
                : "bg-primary hover:bg-primary/90"
            )}
            onClick={toggleListening}
          >
            <AnimatePresence mode="wait">
              {isListening ? (
                <motion.div
                  key="listening"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Mic className="h-6 w-6 text-primary-foreground" />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <MicOff className="h-6 w-6 text-primary-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Listening indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-primary font-medium text-center"
            >
              Listening...
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default FloatingVoiceMic;

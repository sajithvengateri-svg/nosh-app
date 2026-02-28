import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export interface VoiceCommand {
  keywords: string[];
  action: () => void;
  description: string;
  category: "navigation" | "action" | "data" | "ui";
}

interface VoiceCommandContextType {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  registerCommands: (commands: VoiceCommand[]) => void;
  unregisterCommands: (keywords: string[]) => void;
  availableCommands: VoiceCommand[];
  lastCommand: string | null;
  isSupported: boolean;
}

const VoiceCommandContext = createContext<VoiceCommandContextType | null>(null);

// Navigation routes with voice aliases
const NAVIGATION_ROUTES: Record<string, { path: string; aliases: string[] }> = {
  dashboard: { path: "/dashboard", aliases: ["home", "main", "start"] },
  recipes: { path: "/recipes", aliases: ["recipe", "dishes", "menu items"] },
  inventory: { path: "/inventory", aliases: ["stock", "supplies", "storage"] },
  ingredients: { path: "/ingredients", aliases: ["ingredient", "items", "products"] },
  prep: { path: "/prep", aliases: ["prep list", "prep lists", "preparation", "mise en place"] },
  production: { path: "/production", aliases: ["batch", "batches", "produce"] },
  menu: { path: "/menu-engineering", aliases: ["menu engineering", "menus", "pricing"] },
  roster: { path: "/roster", aliases: ["schedule", "shifts", "staff", "team schedule"] },
  allergens: { path: "/allergens", aliases: ["allergen", "allergies", "dietary"] },
  "food safety": { path: "/food-safety", aliases: ["safety", "haccp", "temperature", "temps", "temp log", "temperature log"] },
  training: { path: "/training", aliases: ["learn", "courses", "education"] },
  invoices: { path: "/invoices", aliases: ["invoice", "bills", "receipts", "scan invoice"] },
  cheatsheets: { path: "/cheatsheets", aliases: ["cheat sheet", "reference", "guides", "tips"] },
  calendar: { path: "/calendar", aliases: ["events", "schedule", "operations"] },
  equipment: { path: "/equipment", aliases: ["machines", "appliances", "tools"] },
  team: { path: "/team", aliases: ["staff", "employees", "crew"] },
  marketplace: { path: "/marketplace", aliases: ["vendors", "suppliers", "market"] },
  settings: { path: "/settings", aliases: ["preferences", "options", "config"] },
};

export const VoiceCommandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [customCommands, setCustomCommands] = useState<VoiceCommand[]>([]);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const isSupported = typeof window !== "undefined" && 
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  // Build navigation commands (memoised — navigate is stable from react-router)
  const navigationCommands: VoiceCommand[] = useMemo(() => Object.entries(NAVIGATION_ROUTES).flatMap(
    ([name, { path, aliases }]) => {
      const allKeywords = [name, ...aliases];
      return [
        {
          keywords: allKeywords.map(k => `go to ${k}`),
          action: () => {
            navigate(path);
            toast.success(`Navigating to ${name}`);
          },
          description: `Navigate to ${name}`,
          category: "navigation" as const,
        },
        {
          keywords: allKeywords.map(k => `open ${k}`),
          action: () => {
            navigate(path);
            toast.success(`Opening ${name}`);
          },
          description: `Open ${name}`,
          category: "navigation" as const,
        },
        {
          keywords: allKeywords,
          action: () => {
            navigate(path);
            toast.success(`Going to ${name}`);
          },
          description: `Go to ${name}`,
          category: "navigation" as const,
        },
      ];
    }
  ), [navigate]);

  // Global UI commands (memoised — no deps, static actions)
  const uiCommands: VoiceCommand[] = useMemo(() => [
    {
      keywords: ["go back", "back", "previous", "return"],
      action: () => {
        window.history.back();
        toast.success("Going back");
      },
      description: "Go back to previous page",
      category: "navigation",
    },
    {
      keywords: ["scroll up", "page up", "up"],
      action: () => {
        window.scrollBy({ top: -300, behavior: "smooth" });
      },
      description: "Scroll up",
      category: "ui",
    },
    {
      keywords: ["scroll down", "page down", "down"],
      action: () => {
        window.scrollBy({ top: 300, behavior: "smooth" });
      },
      description: "Scroll down",
      category: "ui",
    },
    {
      keywords: ["scroll to top", "top of page", "go to top"],
      action: () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      description: "Scroll to top",
      category: "ui",
    },
    {
      keywords: ["scroll to bottom", "bottom of page", "go to bottom"],
      action: () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      },
      description: "Scroll to bottom",
      category: "ui",
    },
    {
      keywords: ["refresh", "reload", "reload page"],
      action: () => {
        window.location.reload();
      },
      description: "Refresh page",
      category: "ui",
    },
    {
      keywords: ["help", "what can i say", "voice commands", "commands"],
      action: () => {
        toast.info("Try: 'Go to recipes', 'New recipe', 'Log temperature', 'Start prep list'", {
          duration: 5000,
        });
      },
      description: "Show voice help",
      category: "ui",
    },
  ], []);

  // Context-aware action commands based on current route
  const getContextCommands = useCallback((): VoiceCommand[] => {
    const path = location.pathname;
    const commands: VoiceCommand[] = [];

    // Recipe commands
    if (path.includes("/recipes")) {
      commands.push(
        {
          keywords: ["new recipe", "create recipe", "add recipe", "make recipe"],
          action: () => {
            navigate("/recipes/new");
            toast.success("Creating new recipe");
          },
          description: "Create a new recipe",
          category: "action",
        },
        {
          keywords: ["search recipes", "find recipe", "look for"],
          action: () => {
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
              toast.info("Search field focused - speak your search term");
            }
          },
          description: "Focus search field",
          category: "action",
        }
      );
    }

    // Food safety commands
    if (path.includes("/food-safety")) {
      commands.push(
        {
          keywords: ["log temperature", "record temperature", "new temp", "add temperature", "temp check"],
          action: () => {
            const addButton = document.querySelector('button:has(.lucide-plus)') as HTMLButtonElement;
            if (addButton) {
              addButton.click();
              toast.success("Opening temperature log form");
            }
          },
          description: "Log new temperature",
          category: "data",
        },
        {
          keywords: ["cleaning check", "log cleaning", "cleaning log"],
          action: () => {
            toast.info("Opening cleaning verification");
          },
          description: "Log cleaning verification",
          category: "data",
        }
      );
    }

    // Prep list commands
    if (path.includes("/prep")) {
      commands.push(
        {
          keywords: ["new prep list", "create prep list", "start prep", "add prep list"],
          action: () => {
            const addButton = document.querySelector('button:has(.lucide-plus)') as HTMLButtonElement;
            if (addButton) {
              addButton.click();
              toast.success("Creating new prep list");
            }
          },
          description: "Create new prep list",
          category: "action",
        },
        {
          keywords: ["mark done", "complete item", "finished", "done"],
          action: () => {
            toast.info("Select an item to mark as complete");
          },
          description: "Mark prep item complete",
          category: "action",
        }
      );
    }

    // Inventory commands
    if (path.includes("/inventory")) {
      commands.push(
        {
          keywords: ["add stock", "new item", "add item", "receive stock"],
          action: () => {
            const addButton = document.querySelector('button:has(.lucide-plus)') as HTMLButtonElement;
            if (addButton) {
              addButton.click();
              toast.success("Adding new inventory item");
            }
          },
          description: "Add inventory item",
          category: "data",
        },
        {
          keywords: ["start stocktake", "stock take", "count inventory", "inventory count"],
          action: () => {
            toast.info("Starting stocktake mode");
          },
          description: "Start stocktake",
          category: "action",
        },
        {
          keywords: ["scan invoice", "upload invoice", "add invoice"],
          action: () => {
            navigate("/invoices");
            toast.success("Opening invoice scanner");
          },
          description: "Scan an invoice",
          category: "action",
        }
      );
    }

    // Roster commands
    if (path.includes("/roster")) {
      commands.push(
        {
          keywords: ["add shift", "new shift", "create shift"],
          action: () => {
            toast.info("Click on a day to add a shift");
          },
          description: "Add a shift",
          category: "action",
        }
      );
    }

    // Dashboard commands
    if (path === "/dashboard") {
      commands.push(
        {
          keywords: ["quick action", "what's next", "today's tasks"],
          action: () => {
            toast.info("Showing today's priorities");
          },
          description: "Show quick actions",
          category: "action",
        }
      );
    }

    return commands;
  }, [location.pathname, navigate]);

  // All available commands (memoised)
  const contextCommands = getContextCommands();
  const availableCommands = useMemo(
    () => [...navigationCommands, ...uiCommands, ...contextCommands, ...customCommands],
    [navigationCommands, uiCommands, contextCommands, customCommands]
  );

  // Use ref so startListening never needs to re-memoise when commands change
  const commandsRef = useRef(availableCommands);
  commandsRef.current = availableCommands;

  // Process voice command (stable — reads commands from ref)
  const processCommand = useCallback((text: string) => {
    const lowerText = text.toLowerCase().trim();
    setLastCommand(lowerText);

    for (const command of commandsRef.current) {
      for (const keyword of command.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          command.action();
          return true;
        }
      }
    }

    toast.info(`Heard: "${text}" - Try "help" for commands`, { duration: 3000 });
    return false;
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error("Voice recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("Listening...", { duration: 2000 });
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        processCommand(finalTranscript);
      } else if (interimTranscript) {
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "aborted" && event.error !== "no-speech") {
        toast.error(`Voice error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, processCommand]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const registerCommands = useCallback((commands: VoiceCommand[]) => {
    setCustomCommands(prev => [...prev, ...commands]);
  }, []);

  const unregisterCommands = useCallback((keywords: string[]) => {
    setCustomCommands(prev => 
      prev.filter(cmd => !cmd.keywords.some(k => keywords.includes(k)))
    );
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const value = useMemo(() => ({
    isListening,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    registerCommands,
    unregisterCommands,
    availableCommands,
    lastCommand,
    isSupported,
  }), [isListening, transcript, startListening, stopListening, toggleListening,
       registerCommands, unregisterCommands, availableCommands, lastCommand, isSupported]);

  return (
    <VoiceCommandContext.Provider value={value}>
      {children}
    </VoiceCommandContext.Provider>
  );
};

export const useVoiceCommands = () => {
  const context = useContext(VoiceCommandContext);
  if (!context) {
    throw new Error("useVoiceCommands must be used within a VoiceCommandProvider");
  }
  return context;
};

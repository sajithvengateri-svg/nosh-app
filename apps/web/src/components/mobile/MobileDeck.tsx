 import { useMemo } from "react";
 import { CardDeck, DeckCard } from "./CardDeck";
 import { useNavigate } from "react-router-dom";
 import { toast } from "sonner";
 
 // Generate sample cards for demonstration
 const generateSampleCards = (): DeckCard[] => {
   return [
     // Quick actions
     {
       id: "qa-1",
       type: "quick-action",
       data: {
         title: "Log Temperature",
         description: "Record fridge and freezer temps for food safety compliance",
         icon: "temperature",
         color: "primary",
         urgency: "high",
       },
     },
     {
       id: "qa-2",
       type: "quick-action",
       data: {
         title: "Scan Invoice",
         description: "Capture supplier delivery and auto-update inventory",
         icon: "invoice",
         color: "accent",
         urgency: "low",
       },
     },
     // Notifications
     {
       id: "notif-1",
       type: "notification",
       data: {
         title: "Low Stock Alert",
         message: "Olive oil is below par level. Only 2L remaining.",
         type: "low-stock",
         severity: "warning",
         timestamp: new Date(Date.now() - 1000 * 60 * 30),
         actionLabel: "Reorder",
       },
     },
     {
       id: "notif-2",
       type: "notification",
       data: {
         title: "Expiry Warning",
         message: "Fresh cream expires in 2 days. Use or transfer.",
         type: "expiry",
         severity: "critical",
         timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
         actionLabel: "Mark Used",
       },
     },
     // Dashboard widgets
     {
       id: "widget-1",
       type: "widget",
       data: {
         title: "Today's Prep Progress",
         value: "67%",
         subtitle: "8 of 12 items completed",
         progress: 67,
         icon: "prep",
         status: "warning",
       },
     },
     {
       id: "widget-2",
       type: "widget",
       data: {
         title: "Inventory Value",
         value: "$12,450",
         subtitle: "Updated 2h ago",
         trend: "up",
         trendValue: "+3.2%",
         icon: "inventory",
         status: "good",
       },
     },
     // Recipes
     {
       id: "recipe-1",
       type: "recipe",
       data: {
         name: "Beef Bourguignon",
         category: "Mains",
         prepTime: 45,
         servings: 8,
         costPerServing: 4.25,
         allergens: ["Gluten", "Dairy"],
       },
     },
     {
       id: "recipe-2",
       type: "recipe",
       data: {
         name: "Crème Brûlée",
         category: "Desserts",
         prepTime: 30,
         servings: 6,
         costPerServing: 2.10,
         allergens: ["Dairy", "Eggs"],
       },
     },
     // More quick actions
     {
       id: "qa-3",
       type: "quick-action",
       data: {
         title: "Start Prep List",
         description: "Begin today's mise en place and track progress",
         icon: "prep",
         color: "accent",
         urgency: "medium",
       },
     },
   ];
 };
 
 interface MobileDeckProps {
   className?: string;
 }
 
 export const MobileDeck = ({ className }: MobileDeckProps) => {
   const navigate = useNavigate();
   
   const cards = useMemo(() => generateSampleCards(), []);
 
   const handleAction = (card: DeckCard, action: "left" | "right" | "up") => {
     if (action === "left") {
       // Dismissed
       return;
     }
     
     if (action === "up") {
       // Navigate to details
       switch (card.type) {
         case "recipe":
           navigate("/recipes");
           break;
         case "notification":
           if (card.data.type === "low-stock") navigate("/inventory");
           else if (card.data.type === "expiry") navigate("/inventory");
           break;
         case "widget":
           if (card.data.icon === "prep") navigate("/prep");
           else if (card.data.icon === "inventory") navigate("/inventory");
           break;
         case "quick-action":
           if (card.data.icon === "invoice") navigate("/invoices");
           else if (card.data.icon === "prep") navigate("/prep");
           break;
       }
       return;
     }
     
     if (action === "right") {
       // Primary action
       switch (card.type) {
         case "quick-action":
           toast.success(`Starting: ${card.data.title}`);
           if (card.data.icon === "invoice") navigate("/invoices/scan");
           else if (card.data.icon === "prep") navigate("/prep/new");
           else if (card.data.icon === "temperature") navigate("/food-safety");
           break;
         case "recipe":
           toast.success(`Added to prep: ${card.data.name}`);
           break;
         case "notification":
           toast.success(`Handling: ${card.data.title}`);
           break;
         case "widget":
           toast.info(`Viewing: ${card.data.title}`);
           break;
       }
     }
   };
 
   const handleVoiceCommand = (command: string) => {
     const lowerCommand = command.toLowerCase();
     
     if (lowerCommand.includes("recipe") || lowerCommand.includes("recipes")) {
       navigate("/recipes");
       toast.success("Opening recipes...");
     } else if (lowerCommand.includes("temp") || lowerCommand.includes("temperature")) {
       navigate("/food-safety");
       toast.success("Opening temperature log...");
     } else if (lowerCommand.includes("prep")) {
       navigate("/prep");
       toast.success("Opening prep lists...");
     } else if (lowerCommand.includes("inventory") || lowerCommand.includes("stock")) {
       navigate("/inventory");
       toast.success("Opening inventory...");
     } else if (lowerCommand.includes("skip") || lowerCommand.includes("next")) {
       toast.info("Skipping card...");
     } else if (lowerCommand.includes("do it") || lowerCommand.includes("action")) {
       toast.info("Performing action...");
     }
   };
 
   return (
     <CardDeck
       cards={cards}
       onAction={handleAction}
       onVoiceCommand={handleVoiceCommand}
       className={className}
     />
   );
 };
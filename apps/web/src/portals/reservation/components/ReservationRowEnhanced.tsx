"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Crown,
  GripVertical,
  Cake,
  Leaf,
  AlertTriangle,
  Star,
  PartyPopper,
  MessageSquare,
  Armchair,
  Receipt,
  DoorOpen,
  Eye,
  XCircle,
  UserX,
  Ticket,
  CheckCircle2,
} from "lucide-react";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { JourneyStage } from "@/lib/shared/types/res.types";
import {
  format,
  differenceInMinutes,
  parseISO,
  isWithinInterval,
  addDays,
  subDays,
} from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReservationRowEnhancedProps {
  reservation: any;
  journeyStage: JourneyStage;
  onClick: () => void;
  onNavigate: (path: string) => void;
  onAdvance?: (reservationId: string, targetStage: string) => void;
  waiterName?: string | null;
  customTags?: Array<{ name: string; color: string }>;
}

// ---------------------------------------------------------------------------
// Next-action helper
// ---------------------------------------------------------------------------

interface NextAction {
  label: string;
  icon: React.ElementType;
  target: string;
}

function getNextAction(stage: JourneyStage): NextAction | null {
  switch (stage) {
    case "ARRIVING":
      return { label: "Seat", icon: Armchair, target: "SEATED" };
    case "SEATED":
      return { label: "Bill", icon: Receipt, target: "BILL" };
    case "BILL":
      return { label: "Left", icon: DoorOpen, target: "LEFT" };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Context menu items by stage
// ---------------------------------------------------------------------------

interface CtxAction {
  label: string;
  icon: React.ElementType;
  target: string;
  destructive?: boolean;
}

function getContextActions(stage: JourneyStage): CtxAction[] {
  const actions: CtxAction[] = [];

  if (stage === "ARRIVING") {
    actions.push({ label: "Seat Guest", icon: Armchair, target: "SEATED" });
    actions.push({ label: "No Show", icon: UserX, target: "NO_SHOW", destructive: true });
    actions.push({ label: "Cancel", icon: XCircle, target: "CANCELLED", destructive: true });
  } else if (stage === "SEATED") {
    actions.push({ label: "Drop Bill", icon: Receipt, target: "BILL" });
    actions.push({ label: "Mark Left", icon: DoorOpen, target: "LEFT" });
  } else if (stage === "BILL") {
    actions.push({ label: "Mark Left", icon: DoorOpen, target: "LEFT" });
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const JOURNEY_STAGE_COLORS: Record<string, string> = {
  BOOKED: "bg-slate-100 text-slate-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  REMINDED: "bg-indigo-100 text-indigo-700",
  ARRIVED: "bg-emerald-100 text-emerald-700",
  PARTIALLY_SEATED: "bg-teal-100 text-teal-700",
  SEATED: "bg-green-100 text-green-700",
  ORDERED: "bg-lime-100 text-lime-700",
  SERVED: "bg-cyan-100 text-cyan-700",
  DESSERT: "bg-pink-100 text-pink-700",
  CHECK_DROPPED: "bg-orange-100 text-orange-700",
  PAID: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-gray-200 text-gray-600",
  NO_SHOW: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-50 text-red-500",
};

function isBirthdayNearDate(
  dob: string | null | undefined,
  reservationDate: string | null | undefined,
  dayRange = 3
): boolean {
  if (!dob || !reservationDate) return false;

  try {
    const resDate = parseISO(reservationDate);
    const parsedDob = parseISO(dob);

    const virtualBirthday = new Date(
      resDate.getFullYear(),
      parsedDob.getMonth(),
      parsedDob.getDate()
    );

    return isWithinInterval(virtualBirthday, {
      start: subDays(resDate, dayRange),
      end: addDays(resDate, dayRange),
    });
  } catch {
    return false;
  }
}

function isArrivingSoon(
  reservationTime: string | null | undefined,
  reservationDate: string | null | undefined,
  thresholdMinutes = 30
): boolean {
  if (!reservationTime || !reservationDate) return false;

  try {
    const now = new Date();
    const today = format(now, "yyyy-MM-dd");

    if (reservationDate !== today) return false;

    const resDateTime = parseISO(`${reservationDate}T${reservationTime}`);
    const diff = differenceInMinutes(resDateTime, now);

    return diff >= 0 && diff <= thresholdMinutes;
  } catch {
    return false;
  }
}

function formatTime(time: string | null | undefined): string {
  if (!time) return "--:--";
  try {
    if (time.length <= 8) {
      return time.slice(0, 5);
    }
    return format(parseISO(time), "HH:mm");
  } catch {
    return time.slice(0, 5);
  }
}

// ---------------------------------------------------------------------------
// Swipe threshold
// ---------------------------------------------------------------------------

const SWIPE_THRESHOLD = 80;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ReservationRowEnhanced({
  reservation,
  journeyStage,
  onClick,
  onNavigate,
  onAdvance,
  waiterName,
  customTags,
}: ReservationRowEnhancedProps) {
  // ---- dnd-kit draggable ----
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `res-${reservation.id}`,
      data: { type: "reservation", reservation },
    });

  const dragStyle: React.CSSProperties | undefined = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // ---- Swipe state (framer-motion) ----
  const x = useMotionValue(0);
  const hintOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const [isSwiping, setIsSwiping] = useState(false);

  const nextAction = getNextAction(journeyStage);

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      setIsSwiping(false);
      if (info.offset.x >= SWIPE_THRESHOLD && nextAction && onAdvance) {
        onAdvance(reservation.id, nextAction.target);
      }
    },
    [nextAction, onAdvance, reservation.id]
  );

  // ---- Derived guest data ----
  const guest = reservation.res_guests ?? reservation.guest ?? {};
  const vipTier: string | undefined =
    guest.vip_tier ?? reservation.vip_tier ?? undefined;
  const isVip = vipTier === "VIP" || vipTier === "CHAMPION";

  const dietaryRequirements: string | undefined =
    reservation.dietary_requirements ??
    guest.dietary_requirements ??
    undefined;
  const hasDietary = !!dietaryRequirements;

  const specialRequests: string | undefined =
    reservation.special_requests ?? undefined;
  const hasSpecialRequests = !!specialRequests;

  const occasion: string | undefined = reservation.occasion ?? undefined;
  const hasOccasion = !!occasion;

  const noShowCount: number = guest.no_show_count ?? 0;
  const isNoShowRisk = noShowCount >= 2;

  const dob: string | undefined =
    guest.date_of_birth ?? reservation.date_of_birth ?? undefined;
  const isBirthday = isBirthdayNearDate(dob, reservation.date);

  // ---- Pre-theatre derived data ----
  const isPreTheatre: boolean = !!reservation.is_pre_theatre;
  const showData = reservation.res_shows ?? null;
  const billDroppedAt: string | null = reservation.bill_dropped_at ?? null;

  const preTheatreCountdown = useMemo(() => {
    if (!isPreTheatre || !showData?.curtain_time || journeyStage !== "SEATED") return null;
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const curtain = parseISO(`${today}T${showData.curtain_time}`);
      const billDropTime = new Date(curtain.getTime() - 5 * 60 * 1000);
      const minLeft = differenceInMinutes(billDropTime, new Date());
      return minLeft;
    } catch { return null; }
  }, [isPreTheatre, showData, journeyStage]);

  // ---- Urgency border colour ----
  const borderColor = useMemo(() => {
    // Pre-theatre bill urgency is highest priority
    if (isPreTheatre && preTheatreCountdown !== null && preTheatreCountdown < 15 && !billDroppedAt) {
      return "border-l-red-500";
    }

    const arrivingSoon =
      journeyStage === "CONFIRMED" &&
      isArrivingSoon(reservation.time, reservation.date);

    if (arrivingSoon) return "border-l-red-500";
    if (isVip || hasDietary) return "border-l-amber-500";
    if (hasSpecialRequests) return "border-l-blue-500";
    return "border-l-transparent";
  }, [reservation.time, reservation.date, journeyStage, isVip, hasDietary, hasSpecialRequests, isPreTheatre, preTheatreCountdown, billDroppedAt]);

  // ---- Guest display name ----
  const guestName = [
    guest.first_name ?? reservation.first_name,
    guest.last_name ?? reservation.last_name,
  ]
    .filter(Boolean)
    .join(" ") || "Guest";

  const pax: number = reservation.party_size ?? reservation.pax ?? 0;
  const tableName: string | undefined =
    reservation.table?.name ?? reservation.table_name ?? undefined;

  // ---- Journey badge colour ----
  const journeyBadgeClass =
    JOURNEY_STAGE_COLORS[journeyStage] ?? "bg-gray-100 text-gray-600";

  // ---- Context menu actions ----
  const contextActions = getContextActions(journeyStage);

  // ---- Render ----
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild disabled={contextActions.length === 0 && !onAdvance}>
        <div
          ref={setNodeRef}
          style={dragStyle}
          className={[
            "relative overflow-hidden rounded-md",
            isDragging ? "opacity-50 shadow-lg z-50" : "",
          ].join(" ")}
        >
          {/* Swipe hint behind the row */}
          {nextAction && onAdvance && (
            <motion.div
              className="absolute inset-y-0 left-0 flex items-center px-4 bg-emerald-500 text-white text-sm font-medium rounded-l-md"
              style={{ opacity: hintOpacity }}
            >
              <nextAction.icon className="w-4 h-4 mr-1.5" />
              {nextAction.label}
            </motion.div>
          )}

          {/* Swipeable row */}
          <motion.div
            className={[
              "group relative flex items-center gap-2 px-2 py-2 border-l-4 bg-background cursor-pointer select-none transition-colors",
              borderColor,
              "hover:bg-muted/50",
            ].join(" ")}
            style={{ x }}
            drag={nextAction && onAdvance ? "x" : false}
            dragConstraints={{ left: 0, right: 120 }}
            dragSnapToOrigin
            dragElastic={0.1}
            onDragStart={() => setIsSwiping(true)}
            onDragEnd={handleDragEnd}
            onClick={(e) => {
              if (!isSwiping) onClick();
            }}
          >
            {/* ---- Drag handle (dnd-kit listeners only here) ---- */}
            <button
              className="flex-shrink-0 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity touch-none"
              aria-label="Drag to reorder"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>

            {/* ---- Time ---- */}
            <span className="flex-shrink-0 w-12 text-sm font-bold font-mono tabular-nums leading-none">
              {formatTime(reservation.time)}
            </span>

            {/* ---- Main content (name + pax + table, tags) ---- */}
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              {/* Row 1: name, pax, table */}
              <div className="flex items-center gap-1.5 text-sm leading-tight truncate">
                {isVip && (
                  <Crown className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                )}
                <span className="font-medium truncate">{guestName}</span>
                <span className="text-muted-foreground">&middot;</span>
                <span className="text-muted-foreground whitespace-nowrap">
                  {pax} pax
                </span>
                {tableName && (
                  <>
                    <span className="text-muted-foreground">&middot;</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 leading-none">
                      {tableName}
                    </Badge>
                  </>
                )}
                {waiterName && (
                  <>
                    <span className="text-muted-foreground">&middot;</span>
                    <Badge className="text-[10px] px-1.5 py-0 h-4 leading-none bg-violet-100 text-violet-700 hover:bg-violet-200 border-0">
                      {waiterName}
                    </Badge>
                  </>
                )}
              </div>

              {/* Row 2: auto-detected tag chips + custom tags */}
              <div className="flex items-center gap-1 flex-wrap">
                {isBirthday && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 leading-none bg-pink-100 text-pink-700 hover:bg-pink-200 border-0">
                    <Cake className="h-2.5 w-2.5 mr-0.5" />
                    Birthday
                  </Badge>
                )}

                {hasDietary && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 leading-none bg-amber-100 text-amber-700 hover:bg-amber-200 border-0">
                    <Leaf className="h-2.5 w-2.5 mr-0.5" />
                    Dietary
                  </Badge>
                )}

                {isVip && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 leading-none bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-0">
                    <Star className="h-2.5 w-2.5 mr-0.5" />
                    {vipTier}
                  </Badge>
                )}

                {hasOccasion && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 leading-none bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">
                    <PartyPopper className="h-2.5 w-2.5 mr-0.5" />
                    {occasion}
                  </Badge>
                )}

                {isNoShowRisk && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 leading-none border-red-400 text-red-600"
                  >
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                    No-show risk
                  </Badge>
                )}

                {hasSpecialRequests && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 leading-none bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                    <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
                    Request
                  </Badge>
                )}

                {/* Pre-theatre badges */}
                {isPreTheatre && !billDroppedAt && preTheatreCountdown === null && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 leading-none bg-teal-100 text-teal-700 hover:bg-teal-200 border-0">
                    <Ticket className="h-2.5 w-2.5 mr-0.5" />
                    Pre-Theatre
                    {showData?.curtain_time && (
                      <span className="ml-0.5">{showData.curtain_time.slice(0, 5)}</span>
                    )}
                  </Badge>
                )}

                {isPreTheatre && preTheatreCountdown !== null && preTheatreCountdown > 30 && !billDroppedAt && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 leading-none bg-teal-100 text-teal-700 hover:bg-teal-200 border-0">
                    <Ticket className="h-2.5 w-2.5 mr-0.5" />
                    Pre-Theatre &middot; {preTheatreCountdown}min
                  </Badge>
                )}

                {isPreTheatre && preTheatreCountdown !== null && preTheatreCountdown > 15 && preTheatreCountdown <= 30 && !billDroppedAt && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 leading-none bg-amber-100 text-amber-700 hover:bg-amber-200 border-0">
                    <Ticket className="h-2.5 w-2.5 mr-0.5" />
                    Bill in {preTheatreCountdown}min
                  </Badge>
                )}

                {isPreTheatre && preTheatreCountdown !== null && preTheatreCountdown <= 15 && !billDroppedAt && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 leading-none bg-red-100 text-red-700 hover:bg-red-200 border-0 animate-pulse">
                    <Ticket className="h-2.5 w-2.5 mr-0.5" />
                    BILL NOW &middot; {preTheatreCountdown}min
                  </Badge>
                )}

                {isPreTheatre && billDroppedAt && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 leading-none bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">
                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                    Bill sent
                  </Badge>
                )}

                {/* Custom tags */}
                {customTags?.map((tag) => (
                  <Badge
                    key={tag.name}
                    className="text-[10px] px-1.5 py-0 h-4 leading-none border-0 text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* ---- Inline next-step button ---- */}
            {nextAction && onAdvance && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-7 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdvance(reservation.id, nextAction.target);
                }}
              >
                <nextAction.icon className="h-3.5 w-3.5" />
                {nextAction.label}
              </Button>
            )}

            {/* ---- Journey stage badge ---- */}
            <Badge
              className={[
                "flex-shrink-0 text-[10px] px-2 py-0.5 h-5 leading-none font-medium border-0",
                journeyBadgeClass,
              ].join(" ")}
            >
              {journeyStage.replace(/_/g, " ")}
            </Badge>
          </motion.div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        {contextActions.map((action) => (
          <ContextMenuItem
            key={action.target}
            className={action.destructive ? "text-destructive focus:text-destructive" : ""}
            onClick={() => onAdvance?.(reservation.id, action.target)}
          >
            <action.icon className="h-4 w-4 mr-2" />
            {action.label}
          </ContextMenuItem>
        ))}
        {contextActions.length > 0 && <ContextMenuSeparator />}
        <ContextMenuItem onClick={() => onNavigate(`/reservation/reservations/${reservation.id}`)}>
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default ReservationRowEnhanced;

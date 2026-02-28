import { useState } from "react";
import { View, Text, Pressable, Platform, Modal } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useTheme } from "../../contexts/ThemeProvider";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: "date" | "time" | "datetime";
  label?: string;
  placeholder?: string;
}

export function DatePicker({ value, onChange, mode = "date", label, placeholder }: DatePickerProps) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const { colors } = useTheme();

  const formatDisplay = () => {
    if (!value) return placeholder || "Select...";
    if (mode === "time") return value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (mode === "datetime") return `${value.toLocaleDateString()} ${value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return value.toLocaleDateString();
  };

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
      if (selectedDate) onChange(selectedDate);
    } else {
      if (selectedDate) setTempDate(selectedDate);
    }
  };

  const confirmIOS = () => {
    onChange(tempDate);
    setShow(false);
  };

  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>{label}</Text>}
      <Pressable
        onPress={() => { setTempDate(value); setShow(true); }}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.surface }}
      >
        <Text style={{ fontSize: 15, color: value ? colors.text : colors.textMuted }}>{formatDisplay()}</Text>
      </Pressable>

      {Platform.OS === "android" && show && (
        <DateTimePicker value={tempDate} mode={mode === "datetime" ? "date" : mode} onChange={handleChange} />
      )}

      {Platform.OS === "ios" && (
        <Modal visible={show} transparent animationType="slide">
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }} onPress={() => setShow(false)} />
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Pressable onPress={() => setShow(false)}>
                <Text style={{ fontSize: 16, color: colors.textMuted }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmIOS}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.accent }}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker value={tempDate} mode={mode === "datetime" ? "date" : mode} display="spinner" onChange={handleChange} style={{ height: 200 }} />
          </View>
        </Modal>
      )}
    </View>
  );
}

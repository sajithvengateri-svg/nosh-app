import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { BCCAuditFolder } from "../../../components/features/BCCAuditFolder";

export default function AuditPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Audit Folder" />
        <BCCAuditFolder />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

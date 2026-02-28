import { useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider, useComplianceContext } from "../../../contexts/ComplianceProvider";
import { ProfileCard } from "../../../components/features/ProfileCard";
import { BCCReadiness } from "../../../components/features/BCCReadiness";
import { SetupWizard } from "../../../components/features/SetupWizard";

function OverviewInner() {
  const { colors } = useTheme();
  const { refetch } = useComplianceContext();
  const [showWizard, setShowWizard] = useState(false);

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
        <ProfileCard onSetup={() => setShowWizard(true)} onEdit={() => setShowWizard(true)} />
        <BCCReadiness />
      </ScrollView>
      <SetupWizard
        visible={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={() => { setShowWizard(false); refetch(); }}
      />
    </>
  );
}

export default function OverviewPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Overview" />
        <OverviewInner />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

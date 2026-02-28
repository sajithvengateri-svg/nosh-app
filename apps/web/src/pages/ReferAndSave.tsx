import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ReferralKPICards from "@/components/referral/ReferralKPICards";
import ReferralCodeCard from "@/components/referral/ReferralCodeCard";
import SharePanel from "@/components/referral/SharePanel";
import ReferralTracker from "@/components/referral/ReferralTracker";
import LoyaltyWallet from "@/components/referral/LoyaltyWallet";

const ReferAndSave = () => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Refer & Save</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Share your code, earn credits when friends sign up.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <ReferralKPICards />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ReferralCodeCard />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SharePanel />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ReferralTracker />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <LoyaltyWallet />
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ReferAndSave;

import { Phone, Zap, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ResVoiceAgent = () => {
  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="text-center space-y-6 py-12">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Phone className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold">Voice Agent</h1>
            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            AI-powered phone agent that takes reservations, answers questions, and manages your bookings — 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <Zap className="w-5 h-5 text-amber-500 mx-auto" />
              <p className="text-sm font-medium">Instant Booking</p>
              <p className="text-xs text-muted-foreground">Guests call, AI books — no hold music</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <Clock className="w-5 h-5 text-blue-500 mx-auto" />
              <p className="text-sm font-medium">24/7 Available</p>
              <p className="text-xs text-muted-foreground">Never miss a reservation call again</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <Shield className="w-5 h-5 text-emerald-500 mx-auto" />
              <p className="text-sm font-medium">Powered by Vapi</p>
              <p className="text-xs text-muted-foreground">Connect your venue phone line in minutes</p>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground pt-4">
          Configure your Vapi API key and assistant in Settings when ready.
        </p>
      </div>
    </div>
  );
};

export default ResVoiceAgent;

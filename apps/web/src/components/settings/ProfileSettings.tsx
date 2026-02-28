import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Calendar, Camera, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { isHomeCookMode } from "@/lib/shared/modeConfig";
import { homeCookRoleLabel } from "@/lib/homeCookLabels";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAppSettings, compressImage } from "@/hooks/useAppSettings";

const ProfileSettings = () => {
  const { profile, isHeadChef, refreshProfile } = useAuth();
  const { storeMode } = useOrg();
  const isHomeCook = isHomeCookMode(storeMode);
  const { settings } = useAppSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    birthday: profile?.birthday || "",
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Compress image based on settings
      const compressedFile = await compressImage(file, settings);
      
      const fileExt = "jpg"; // Always save as jpg after compression
      const fileName = `${profile.user_id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(filePath, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", profile.user_id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success("Avatar updated");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          birthday: formData.birthday || null,
        })
        .eq("user_id", profile.user_id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Please sign in to view profile settings
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Manage your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                {isUploadingAvatar ? (
                  <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-primary-foreground" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{profile.full_name}</h3>
              <Badge variant={isHeadChef ? "default" : "secondary"}>
                {isHomeCook ? homeCookRoleLabel(isHeadChef ? "head_chef" : "line_chef") : (isHeadChef ? "Head Chef" : "Line Chef")}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">{profile.position}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.full_name}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{profile.email}</span>
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.phone || "Not set"}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              {isEditing ? (
                <Input
                  id="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.birthday || "Not set"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your login credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            Change Password
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            You'll receive an email with instructions to reset your password
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfileSettings;

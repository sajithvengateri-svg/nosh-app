import { useState } from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Clock, AlertTriangle, Trash2, ChevronDown, ChevronUp, Shield, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { RecipeCCP, CCPFormData, CCPStepType, HazardType, MonitoringFrequency, STEP_TYPE_CONFIG, HAZARD_TYPE_CONFIG } from '@/types/ccp';

interface CCPPointEditorProps {
  ccp: RecipeCCP | null;
  haccpMode: boolean;
  onSave: (data: CCPFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}

const defaultFormData: CCPFormData = {
  step_name: '',
  step_type: 'cook',
  target_temp: null,
  temp_unit: 'C',
  time_limit: null,
  is_critical: false,
  timeline_position: 50,
  hazard_type: null,
  hazard_description: '',
  critical_limit_min: null,
  critical_limit_max: null,
  monitoring_procedure: '',
  monitoring_frequency: null,
  corrective_action: '',
  verification_method: '',
  record_keeping_notes: '',
};

export const CCPPointEditor = ({
  ccp,
  haccpMode,
  onSave,
  onDelete,
  onCancel,
}: CCPPointEditorProps) => {
  const [formData, setFormData] = useState<CCPFormData>(() => {
    if (ccp) {
      return {
        step_name: ccp.step_name,
        step_type: ccp.step_type,
        target_temp: ccp.target_temp,
        temp_unit: ccp.temp_unit,
        time_limit: ccp.time_limit,
        is_critical: ccp.is_critical,
        timeline_position: ccp.timeline_position,
        hazard_type: ccp.hazard_type,
        hazard_description: ccp.hazard_description || '',
        critical_limit_min: ccp.critical_limit_min,
        critical_limit_max: ccp.critical_limit_max,
        monitoring_procedure: ccp.monitoring_procedure || '',
        monitoring_frequency: ccp.monitoring_frequency,
        corrective_action: ccp.corrective_action || '',
        verification_method: ccp.verification_method || '',
        record_keeping_notes: ccp.record_keeping_notes || '',
      };
    }
    return defaultFormData;
  });
  const [saving, setSaving] = useState(false);
  const [haccpOpen, setHaccpOpen] = useState(haccpMode);

  const handleSave = async () => {
    if (!formData.step_name.trim()) return;
    
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const stepTypes = Object.entries(STEP_TYPE_CONFIG) as [CCPStepType, typeof STEP_TYPE_CONFIG[CCPStepType]][];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card border rounded-xl p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          {ccp ? 'Edit Control Point' : 'New Control Point'}
        </h4>
        {onDelete && (
          <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Basic Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="step_name">Step Name *</Label>
          <Input
            id="step_name"
            value={formData.step_name}
            onChange={(e) => setFormData(prev => ({ ...prev, step_name: e.target.value }))}
            placeholder="e.g., Cook to internal temp"
          />
        </div>

        <div className="space-y-2">
          <Label>Step Type</Label>
          <div className="flex flex-wrap gap-2">
            {stepTypes.map(([type, config]) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, step_type: type }))}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1",
                  formData.step_type === type
                    ? `${config.color} text-white`
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                <span>{config.icon}</span>
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Check Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-orange-500" />
            Target Temperature
          </Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={formData.target_temp ?? ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                target_temp: e.target.value ? Number(e.target.value) : null 
              }))}
              placeholder="75"
              className="flex-1"
            />
            <Select
              value={formData.temp_unit}
              onValueChange={(v) => setFormData(prev => ({ ...prev, temp_unit: v as 'C' | 'F' }))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="C">°C</SelectItem>
                <SelectItem value="F">°F</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Time Limit (mins)
          </Label>
          <Input
            type="number"
            value={formData.time_limit ?? ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              time_limit: e.target.value ? Number(e.target.value) : null 
            }))}
            placeholder="30"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Critical Point
          </Label>
          <div className="flex items-center gap-2 h-10">
            <Switch
              checked={formData.is_critical}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_critical: checked }))}
            />
            <span className="text-sm text-muted-foreground">
              {formData.is_critical ? 'Yes - requires monitoring' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Full HACCP Section */}
      <Collapsible open={haccpOpen} onOpenChange={setHaccpOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between" type="button">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Full HACCP Details
            </span>
            {haccpOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hazard Type</Label>
              <Select
                value={formData.hazard_type ?? ''}
                onValueChange={(v) => setFormData(prev => ({ ...prev, hazard_type: v as HazardType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hazard type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(HAZARD_TYPE_CONFIG) as [HazardType, typeof HAZARD_TYPE_CONFIG[HazardType]][]).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      <span className={config.color}>{config.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Monitoring Frequency</Label>
              <Select
                value={formData.monitoring_frequency ?? ''}
                onValueChange={(v) => setFormData(prev => ({ ...prev, monitoring_frequency: v as MonitoringFrequency }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="each_batch">Each Batch</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="per_item">Per Item</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Hazard Description</Label>
            <Textarea
              value={formData.hazard_description}
              onChange={(e) => setFormData(prev => ({ ...prev, hazard_description: e.target.value }))}
              placeholder="Describe the potential hazard..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Critical Limit Min</Label>
              <Input
                type="number"
                value={formData.critical_limit_min ?? ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  critical_limit_min: e.target.value ? Number(e.target.value) : null 
                }))}
                placeholder="63"
              />
            </div>
            <div className="space-y-2">
              <Label>Critical Limit Max</Label>
              <Input
                type="number"
                value={formData.critical_limit_max ?? ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  critical_limit_max: e.target.value ? Number(e.target.value) : null 
                }))}
                placeholder="75"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Monitoring Procedure</Label>
            <Textarea
              value={formData.monitoring_procedure}
              onChange={(e) => setFormData(prev => ({ ...prev, monitoring_procedure: e.target.value }))}
              placeholder="How to monitor this control point..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Corrective Action</Label>
            <Textarea
              value={formData.corrective_action}
              onChange={(e) => setFormData(prev => ({ ...prev, corrective_action: e.target.value }))}
              placeholder="What to do if limits are exceeded..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Verification Method</Label>
              <Input
                value={formData.verification_method}
                onChange={(e) => setFormData(prev => ({ ...prev, verification_method: e.target.value }))}
                placeholder="e.g., Probe thermometer"
              />
            </div>
            <div className="space-y-2">
              <Label>Record Keeping Notes</Label>
              <Input
                value={formData.record_keeping_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, record_keeping_notes: e.target.value }))}
                placeholder="e.g., Log in temp chart"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || !formData.step_name.trim()}>
          {saving ? 'Saving...' : (ccp ? 'Update' : 'Add Point')}
        </Button>
      </div>
    </motion.div>
  );
};

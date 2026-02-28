import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Camera, Archive } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import InvoiceScannerDialog from "@/components/inventory/InvoiceScannerDialog";
import RecentScans from "@/components/invoices/RecentScans";
import InvoiceArchive from "@/components/invoices/InvoiceArchive";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Invoices = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="page-title font-display">Invoices</h1>
            <p className="page-subtitle">Scan, archive and manage supplier invoices</p>
          </div>
        </motion.div>

        <Tabs defaultValue="scan" className="space-y-6">
          <TabsList>
            <TabsTrigger value="scan"><Camera className="w-4 h-4 mr-2" />Scan</TabsTrigger>
            <TabsTrigger value="archive"><Archive className="w-4 h-4 mr-2" />Archive</TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-6">
            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-elevated p-8"
            >
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Scan or Upload Invoice</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Take a photo or upload a PDF to automatically extract items and prices
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button className="btn-primary" onClick={() => setIsScannerOpen(true)}>
                      <Camera className="w-4 h-4 mr-2" />
                      Scan Invoice
                    </button>
                    <button 
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-input bg-background hover:bg-muted transition-colors"
                      onClick={() => setIsScannerOpen(true)}
                    >
                      <Upload className="w-4 h-4" />
                      Upload File
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-elevated p-6"
            >
              <h3 className="font-semibold mb-3">How it works</h3>
              <div className="grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">1</div>
                  <p>Upload or scan your supplier invoice</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">2</div>
                  <p>AI extracts items and prices automatically</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">3</div>
                  <p>Ingredient costs update across all recipes</p>
                </div>
              </div>
            </motion.div>

            {/* Recent Scans History */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <RecentScans />
            </motion.div>
          </TabsContent>

          <TabsContent value="archive">
            <InvoiceArchive />
          </TabsContent>
        </Tabs>
      </div>

      <InvoiceScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
      />
    </AppLayout>
  );
};

export default Invoices;

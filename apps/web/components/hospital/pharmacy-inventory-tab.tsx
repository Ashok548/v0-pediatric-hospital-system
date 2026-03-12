"use client";

import { useState, useRef } from "react";
import { ApiMedication, usePharmacyInventory, createMedication, bulkCreateMedications, updateMedication, deactivateMedication } from "@/lib/api/pharmacy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { PackagePlus, Upload, Search, Pill, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2, Download, Edit3, Trash2, Archive, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function PharmacyInventoryTab() {
    const { inventory, isLoading, mutate } = usePharmacyInventory();
    const [search, setSearch] = useState("");
    
    // Dialog states
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [editingMed, setEditingMed] = useState<ApiMedication | null>(null);
    const [deactivatingMed, setDeactivatingMed] = useState<ApiMedication | null>(null);
    
    // Filtered inventory
    const filteredInventory = inventory.filter(med => 
        (med.drugName.toLowerCase().includes(search.toLowerCase()) || 
        med.genericName.toLowerCase().includes(search.toLowerCase())) &&
        med.status !== 'INACTIVE'
    );

    const handleDeactivate = async (med: ApiMedication) => {
        if (!confirm(`Are you sure you want to deactivate ${med.drugName}?`)) return;
        try {
            await deactivateMedication(med.id);
            toast.success(`${med.drugName} deactivated successfully`);
            mutate();
        } catch (error: any) {
            toast.error(error.message || "Failed to deactivate");
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by drug or generic name..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={() => setShowImportDialog(true)}>
                        <Upload className="h-4 w-4 text-blue-600" /> Import CSV
                    </Button>
                    <Button className="gap-2 w-full sm:w-auto" onClick={() => setShowAddDialog(true)}>
                        <PackagePlus className="h-4 w-4" /> Add Medication
                    </Button>
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-4">Loading inventory...</p>
                </div>
            ) : filteredInventory.length === 0 ? (
                <div className="py-24 text-center border rounded-xl border-dashed bg-muted/20">
                    <Pill className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    <h3 className="text-lg font-medium">No medications found</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                        {search ? "Try adjusting your search query." : "Your catalog is empty. Add a new medication or import a CSV to get started."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredInventory.map(med => (
                        <Card key={med.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h4 className="font-semibold text-base truncate" title={med.drugName}>{med.drugName}</h4>
                                        <p className="text-xs text-muted-foreground truncate" title={med.genericName}>{med.genericName}</p>
                                    </div>
                                    <Badge variant="outline" className="shrink-0 bg-primary/5 border-primary/20 text-primary uppercase text-[10px] px-1.5 py-0 h-5">
                                        {med.form}
                                    </Badge>
                                </div>
                                <div className="space-y-1.5 mt-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Strength</span>
                                        <span className="font-medium">{med.strength}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Price</span>
                                        <span className="font-medium">₹{med.unitPrice} / {med.unit}</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-t pt-1.5 mt-1.5">
                                        <span className="text-muted-foreground">Stock Available</span>
                                        <span className={`font-bold ${med.stockAvailable <= med.reorderLevel ? "text-red-500" : "text-green-600"}`}>
                                            {med.stockAvailable} {med.unit}
                                        </span>
                                    </div>
                                    {med.stockAvailable <= med.reorderLevel && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded pt-1">
                                            <AlertCircle className="h-3 w-3" /> Reorder needed (Threshold: {med.reorderLevel})
                                        </div>
                                    )}
                                    <div className="flex gap-2 mt-4 pt-3 border-t">
                                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => setEditingMed(med)}>
                                            <Edit3 className="h-3.5 w-3.5" /> Edit
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-8 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeactivate(med)}>
                                            <Archive className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AddMedicationDialog 
                open={showAddDialog} 
                onOpenChange={setShowAddDialog} 
                onSuccess={() => { mutate(); setShowAddDialog(false); }} 
            />
            
            <ImportCsvDialog 
                open={showImportDialog} 
                onOpenChange={setShowImportDialog} 
                onSuccess={() => { mutate(); setShowImportDialog(false); }} 
            />

            <EditMedicationDialog
                medication={editingMed}
                open={!!editingMed}
                onOpenChange={(open) => !open && setEditingMed(null)}
                onSuccess={() => { mutate(); setEditingMed(null); }}
            />
        </div>
    );
}

// ----------------------------------------------------------------------
// Sub-components for Dialogs
// ----------------------------------------------------------------------

function AddMedicationDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        drugName: "", genericName: "", form: "", strength: "", unit: "tablets", unitPrice: "", stockAvailable: "", reorderLevel: "10"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createMedication({
                ...formData,
                unitPrice: Number(formData.unitPrice),
                stockAvailable: Number(formData.stockAvailable),
                reorderLevel: Number(formData.reorderLevel),
            });
            toast.success("Medication added to catalog successfully");
            onSuccess();
            setFormData({ drugName: "", genericName: "", form: "", strength: "", unit: "tablets", unitPrice: "", stockAvailable: "", reorderLevel: "10" });
        } catch (error: any) {
            toast.error(error.message || "Failed to add medication");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add New Medication</DialogTitle>
                    <DialogDescription>Add a new medication type to the pharmacy catalog.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Drug / Brand Name *</Label>
                            <Input required value={formData.drugName} onChange={e => setFormData({ ...formData, drugName: e.target.value })} placeholder="e.g. Augmentin 625 Duo" />
                        </div>
                        <div className="space-y-2">
                            <Label>Generic Name *</Label>
                            <Input required value={formData.genericName} onChange={e => setFormData({ ...formData, genericName: e.target.value })} placeholder="e.g. Amoxicillin & Clavulanate Potassium" />
                        </div>
                        <div className="space-y-2">
                            <Label>Form (e.g. Tablet, Syrup, Vial) *</Label>
                            <Input required value={formData.form} onChange={e => setFormData({ ...formData, form: e.target.value })} placeholder="e.g. Tablet" />
                        </div>
                        <div className="space-y-2">
                            <Label>Strength *</Label>
                            <Input required value={formData.strength} onChange={e => setFormData({ ...formData, strength: e.target.value })} placeholder="e.g. 625mg" />
                        </div>
                        <div className="space-y-2">
                            <Label>Unit of Issue *</Label>
                            <Input required value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="e.g. tablets, bottles" />
                        </div>
                        <div className="space-y-2">
                            <Label>Unit Price (₹) *</Label>
                            <Input type="number" step="0.01" min="0" required value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: e.target.value })} placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                            <Label>Initial Stock *</Label>
                            <Input type="number" min="0" required value={formData.stockAvailable} onChange={e => setFormData({ ...formData, stockAvailable: e.target.value })} placeholder="0" />
                        </div>
                        <div className="space-y-2">
                            <Label>Reorder Level *</Label>
                            <Input type="number" min="0" required value={formData.reorderLevel} onChange={e => setFormData({ ...formData, reorderLevel: e.target.value })} placeholder="10" />
                        </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Medication
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditMedicationDialog({ medication, open, onOpenChange, onSuccess }: { medication: ApiMedication | null, open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        drugName: "", genericName: "", form: "", strength: "", unit: "", unitPrice: "", stockAvailable: "", reorderLevel: ""
    });

    // Sync form data when medication changes
    useState(() => {
        if (medication) {
            setFormData({
                drugName: medication.drugName,
                genericName: medication.genericName,
                form: medication.form,
                strength: medication.strength,
                unit: medication.unit,
                unitPrice: String(medication.unitPrice),
                stockAvailable: String(medication.stockAvailable),
                reorderLevel: String(medication.reorderLevel),
            });
        }
    });

    // Need a useEffect to watch medication changes since useState init only runs once
    // But since this is a subcomponent that might be unmounted/remounted, we can use a ref or effect
    const lastMedId = useRef<string | null>(null);
    if (medication && medication.id !== lastMedId.current) {
        lastMedId.current = medication.id;
        setFormData({
            drugName: medication.drugName,
            genericName: medication.genericName,
            form: medication.form,
            strength: medication.strength,
            unit: medication.unit,
            unitPrice: String(medication.unitPrice),
            stockAvailable: String(medication.stockAvailable),
            reorderLevel: String(medication.reorderLevel),
        });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!medication) return;
        setSubmitting(true);
        try {
            await updateMedication(medication.id, {
                ...formData,
                unitPrice: Number(formData.unitPrice),
                stockAvailable: Number(formData.stockAvailable),
                reorderLevel: Number(formData.reorderLevel),
            });
            toast.success("Medication updated successfully");
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Failed to update medication");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Medication</DialogTitle>
                    <DialogDescription>Update the details for {medication?.drugName}.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Drug / Brand Name *</Label>
                            <Input required value={formData.drugName} onChange={e => setFormData({ ...formData, drugName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Generic Name *</Label>
                            <Input required value={formData.genericName} onChange={e => setFormData({ ...formData, genericName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Form *</Label>
                            <Input required value={formData.form} onChange={e => setFormData({ ...formData, form: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Strength *</Label>
                            <Input required value={formData.strength} onChange={e => setFormData({ ...formData, strength: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Unit *</Label>
                            <Input required value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Unit Price (₹) *</Label>
                            <Input type="number" step="0.01" min="0" required value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Stock Available *</Label>
                            <Input type="number" min="0" required value={formData.stockAvailable} onChange={e => setFormData({ ...formData, stockAvailable: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Reorder Level *</Label>
                            <Input type="number" min="0" required value={formData.reorderLevel} onChange={e => setFormData({ ...formData, reorderLevel: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ImportCsvDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 });

    const REQUIRED_COLUMNS = ["drugName", "genericName", "form", "strength", "unit", "unitPrice", "stockAvailable", "reorderLevel"];

    const resetState = () => {
        setParsedData([]);
        setStats({ total: 0, valid: 0, invalid: 0 });
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsValidating(true);
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;
            
            // Basic CSV parser
            const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length < 2) {
                toast.error("File appears to be empty or missing data rows");
                setIsValidating(false);
                return;
            }

            const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ''));
            
            // Check headers
            const missingHeaders = REQUIRED_COLUMNS.filter(req => !headers.includes(req));
            if (missingHeaders.length > 0) {
                toast.error(`Missing required columns: ${missingHeaders.join(", ")}`);
                setIsValidating(false);
                return;
            }

            const dataRows = lines.slice(1).map((line, index) => {
                // Handle basic unescaping of quotes if necessary. 
                // For a robust system, PapaParse is better, but this works for basic templates.
                const values = line.split(",").map(v => v.trim().replace(/^["']|["']$/g, ''));
                
                const row: any = { _id: index, _isValid: true, _errors: [] };
                headers.forEach((header, i) => {
                    row[header] = values[i];
                });

                // Validation
                ["drugName", "genericName", "form"].forEach(field => {
                    if (!row[field]) { row._isValid = false; row._errors.push(`${field} requires text`); }
                });
                
                ["unitPrice", "stockAvailable", "reorderLevel"].forEach(field => {
                    if (isNaN(Number(row[field]))) { row._isValid = false; row._errors.push(`${field} must be a number`); }
                });

                return row;
            });

            const validCount = dataRows.filter(r => r._isValid).length;
            setStats({ total: dataRows.length, valid: validCount, invalid: dataRows.length - validCount });
            setParsedData(dataRows);
            setIsValidating(false);
        };

        reader.readAsText(file);
    };

    const handleImport = async () => {
        const validRows = parsedData.filter(r => r._isValid).map(r => ({
            drugName: r.drugName,
            genericName: r.genericName,
            form: r.form,
            strength: r.strength,
            unit: r.unit,
            unitPrice: Number(r.unitPrice),
            stockAvailable: Number(r.stockAvailable),
            reorderLevel: Number(r.reorderLevel)
        }));

        if (validRows.length === 0) {
            toast.error("No valid rows to import");
            return;
        }

        setIsImporting(true);
        try {
            const res = await bulkCreateMedications(validRows);
            toast.success(`Successfully imported ${res.data.count} medications!`);
            resetState();
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Import failed");
        } finally {
            setIsImporting(false);
        }
    };

    const downloadTemplate = () => {
        const header = REQUIRED_COLUMNS.join(",");
        const row1 = "Ibuprofen,Ibuprofen,Suspension,100mg/5ml,bottles,30.00,120,25";
        const row2 = "Cefixime,Cefixime Trihydrate,Suspension,50mg/5ml,bottles,75.00,45,10";
        const csvContent = "data:text/csv;charset=utf-8," + header + "\n" + row1 + "\n" + row2;
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "medication_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetState();
            onOpenChange(val);
        }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="shrink-0">
                    <DialogTitle>Import Medications from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to bulk import catalog items. Make sure your file matches the template structure.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                    {/* Step 1: Upload */}
                    {!parsedData.length && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border rounded-xl p-4 bg-muted/20">
                                <div>
                                    <h4 className="font-semibold flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-green-600" /> Prepare your data</h4>
                                    <p className="text-sm text-muted-foreground mt-1">Download the template and fill in your catalog details.</p>
                                </div>
                                <Button variant="outline" className="gap-2" onClick={downloadTemplate}>
                                    <Download className="h-4 w-4" /> Download Template
                                </Button>
                            </div>
                            
                            <div 
                                className="border-2 border-dashed rounded-xl p-12 text-center hover:bg-muted/10 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input 
                                    type="file" 
                                    accept=".csv" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange}
                                />
                                {isValidating ? (
                                    <Loader2 className="h-10 w-10 mx-auto animate-spin text-muted-foreground" />
                                ) : (
                                    <Upload className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
                                )}
                                <h3 className="font-semibold text-lg">{isValidating ? "Validating File..." : "Click to select a CSV file"}</h3>
                                <p className="text-sm text-muted-foreground mt-1">Accepts standard .csv files</p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Preview & Validate */}
                    {parsedData.length > 0 && (
                        <div className="space-y-4 h-full flex flex-col">
                            <div className="flex items-center justify-between bg-card border rounded-lg p-3 shrink-0">
                                <div className="flex gap-4">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">Total: {stats.total}</Badge>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">Valid: {stats.valid}</Badge>
                                    {stats.invalid > 0 && (
                                        <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 gap-1.5 border-red-200">
                                            <AlertCircle className="h-3 w-3" /> Errors: {stats.invalid}
                                        </Badge>
                                    )}
                                </div>
                                <Button variant="ghost" size="sm" onClick={resetState}>Upload Different File</Button>
                            </div>

                            <div className="border rounded-md overflow-x-auto flex-1">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted text-muted-foreground sticky top-0 text-xs uppercase">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium">Drug Name</th>
                                            <th className="px-4 py-3 font-medium">Generic</th>
                                            <th className="px-4 py-3 font-medium">Form/Str</th>
                                            <th className="px-4 py-3 font-medium">Price</th>
                                            <th className="px-4 py-3 font-medium">Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-xs">
                                        {parsedData.slice(0, 50).map((row, i) => (
                                            <tr key={i} className={row._isValid ? "hover:bg-muted/50" : "bg-red-50/50 dark:bg-red-900/10"}>
                                                <td className="px-4 py-2">
                                                    {row._isValid ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <div className="group relative">
                                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                                            <div className="absolute left-6 top-0 hidden group-hover:block bg-red-900 text-white text-[10px] p-1.5 rounded z-10 w-48 shadow-lg">
                                                                {row._errors.map((err: string, idx: number) => <div key={idx}>• {err}</div>)}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 font-medium">{row.drugName}</td>
                                                <td className="px-4 py-2 truncate max-w-[150px]" title={row.genericName}>{row.genericName}</td>
                                                <td className="px-4 py-2">{row.form} {row.strength}</td>
                                                <td className="px-4 py-2">₹{row.unitPrice}</td>
                                                <td className="px-4 py-2">{row.stockAvailable}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {parsedData.length > 50 && (
                                    <div className="p-3 text-center text-xs text-muted-foreground bg-muted/20 border-t">
                                        Showing first 50 of {parsedData.length} records...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="shrink-0 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button 
                        onClick={handleImport} 
                        disabled={isImporting || stats.valid === 0}
                        className="gap-2"
                    >
                        {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Import {stats.valid} Valid Records
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

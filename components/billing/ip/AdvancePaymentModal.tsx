"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { IndianRupee, Wallet } from "lucide-react"
import { BillPayment, PaymentStatus } from "@/lib/types/billing"

export function AdvancePaymentModal({ onAddAdvance }: { onAddAdvance: (payment: BillPayment) => void }) {
    const [open, setOpen] = useState(false)
    const [amount, setAmount] = useState<number>(0)
    const [mode, setMode] = useState<string>("UPI")
    const [remarks, setRemarks] = useState("")

    const handleAdd = () => {
        if (amount <= 0) return;

        onAddAdvance({
            id: `ADV-${Date.now()}`,
            amount,
            mode,
            status: PaymentStatus.Completed,
            date: new Date().toISOString(),
            isAdvance: true,
            receiptNo: `REC-${Math.floor(Math.random() * 10000)}`
        })

        setOpen(false)
        setAmount(0)
        setMode("UPI")
        setRemarks("")
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 shrink-0">
                    <Wallet className="size-4" />
                    Collect Advance
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Collect Advance Payment</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Advance Amount</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <Input
                                type="number"
                                min={1}
                                className="pl-8 text-lg font-semibold h-12"
                                value={amount || ""}
                                onChange={e => setAmount(Number(e.target.value) || 0)}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Payment Mode</Label>
                        <Select value={mode} onValueChange={setMode}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Card">Card</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="Online">Online / Transfer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Remarks (Optional)</Label>
                        <Input
                            placeholder="E.g., Initial Deposit"
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleAdd} disabled={amount <= 0}>Confirm Payment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

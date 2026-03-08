"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Wallet, Loader2 } from "lucide-react"
import { RecordPaymentDto, PaymentMode, MappedPaymentModeLabels } from "@/lib/types/billing"

export function AdvancePaymentModal({
    onAddAdvance,
    isSubmitting = false
}: {
    onAddAdvance: (payment: RecordPaymentDto) => void,
    isSubmitting?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [amount, setAmount] = useState<number>(0)
    const [mode, setMode] = useState<PaymentMode>("UPI")
    const [transactionRef, setTransactionRef] = useState("")

    const handleAdd = () => {
        if (amount <= 0 || isSubmitting) return;

        onAddAdvance({
            amount,
            paymentMode: mode,
            transactionRef: transactionRef || undefined
        })

        // NOTE: We don't auto-close here if isSubmitting is true. It will be handled by the parent
        setOpen(false)
        setAmount(0)
        setMode("UPI")
        setTransactionRef("")
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
                        <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Mode" />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.entries(MappedPaymentModeLabels)).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Transaction / Ref ID (Optional)</Label>
                        <Input
                            placeholder="E.g., UTR / Cheque No."
                            value={transactionRef}
                            onChange={e => setTransactionRef(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleAdd} disabled={amount <= 0 || isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                        Confirm Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

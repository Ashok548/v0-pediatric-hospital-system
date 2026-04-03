"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PaymentMode, RecordPaymentDto, MappedPaymentModeLabels } from "@/lib/types/billing"
import { IndianRupee, Loader2 } from "lucide-react"

function nextIdempotencyKey() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function PaymentCollectionForm({
    balanceDue,
    onPaymentAdd,
    isSubmitting = false
}: {
    balanceDue: number,
    onPaymentAdd: (p: RecordPaymentDto) => void,
    isSubmitting?: boolean
}) {
    const [amount, setAmount] = useState<number>(balanceDue)
    const [mode, setMode] = useState<PaymentMode>("UPI")
    const [transactionRef, setTransactionRef] = useState("")
    const [idempotencyKey, setIdempotencyKey] = useState(() => nextIdempotencyKey())

    useEffect(() => {
        setAmount(balanceDue)
        setIdempotencyKey(nextIdempotencyKey())
    }, [balanceDue])

    const handleAdd = () => {
        if (amount <= 0 || amount > balanceDue || isSubmitting) return;

        onPaymentAdd({
            amount,
            paymentMode: mode,
            transactionRef: transactionRef || undefined,
            idempotencyKey,
        })
    }

    return (
        <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <IndianRupee className="size-4" /> Collect Payment
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select value={mode} onValueChange={v => {
                        setMode(v as PaymentMode)
                        setIdempotencyKey(nextIdempotencyKey())
                    }}>
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
                {(mode === 'UPI' || mode === 'ONLINE' || mode === 'CARD' || mode === 'CHEQUE' || mode === 'INSURANCE') && (
                    <div className="space-y-2">
                        <Label>Transaction / Ref ID (Optional)</Label>
                        <Input
                            value={transactionRef}
                            onChange={e => {
                                setTransactionRef(e.target.value)
                                setIdempotencyKey(nextIdempotencyKey())
                            }}
                            placeholder="e.g. UTR or Check Number"
                        />
                    </div>
                )}
                <div className="space-y-2">
                    <Label>Amount to Collect</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                            type="number"
                            className="pl-8"
                            value={amount}
                            onChange={e => {
                                setAmount(Number(e.target.value))
                                setIdempotencyKey(nextIdempotencyKey())
                            }}
                            max={balanceDue}
                        />
                    </div>
                </div>
            </CardContent>
            {balanceDue > 0 ? (
                <CardFooter className="p-4 border-t bg-muted/30">
                    <Button onClick={handleAdd} disabled={amount <= 0 || amount > balanceDue || isSubmitting} className="w-full">
                        {isSubmitting ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                        Confirm Payment of ₹{amount || 0}
                    </Button>
                </CardFooter>
            ) : (
                <CardFooter className="p-4 border-t bg-green-50/50 justify-center">
                    <p className="text-sm font-medium text-green-700">Bill fully paid!</p>
                </CardFooter>
            )}
        </Card>
    )
}

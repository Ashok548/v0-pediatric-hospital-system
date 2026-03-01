"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PaymentStatus, BillPayment } from "@/lib/types/billing"
import { IndianRupee } from "lucide-react"

export function PaymentCollectionForm({ balanceDue, onPaymentAdd }: { balanceDue: number, onPaymentAdd: (p: BillPayment) => void }) {
    const [amount, setAmount] = useState<number>(balanceDue)
    const [mode, setMode] = useState<string>("UPI")

    const handleAdd = () => {
        if (amount <= 0 || amount > balanceDue) return;

        onPaymentAdd({
            id: `PAY-${Date.now()}`,
            amount,
            mode,
            status: PaymentStatus.Completed,
            date: new Date().toISOString()
        })
        setAmount(balanceDue - amount)
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
                <div className="space-y-2">
                    <Label>Amount to Collect</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                            type="number"
                            className="pl-8"
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                            max={balanceDue}
                        />
                    </div>
                </div>
            </CardContent>
            {balanceDue > 0 ? (
                <CardFooter className="p-4 border-t bg-muted/30">
                    <Button onClick={handleAdd} disabled={amount <= 0 || amount > balanceDue} className="w-full">
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

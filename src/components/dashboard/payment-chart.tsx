'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { PaymentMethodData } from '@/services/dashboard.service'

interface PaymentChartProps {
  data: PaymentMethodData[]
}

export function PaymentChart({ data }: PaymentChartProps) {
  return (
    <Card className="col-span-full md:col-span-1">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Formas de Pagamento</CardTitle>
        <CardDescription>Distribuição de recebimentos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis
                type="category"
                dataKey="method"
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={85}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as PaymentMethodData
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md text-xs">
                        <span className="font-semibold text-foreground">
                          {item.method}: {item.value}% do total
                        </span>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex justify-between text-xs text-muted-foreground border-t pt-2">
          <span>Mais utilizado: <strong className="text-emerald-600 dark:text-emerald-400">PIX (55%)</strong></span>
          <span>Cartões: <strong>30%</strong></span>
        </div>
      </CardContent>
    </Card>
  )
}

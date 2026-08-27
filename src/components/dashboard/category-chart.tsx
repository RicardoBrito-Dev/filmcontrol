'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ServiceCategoryData } from '@/services/dashboard.service'

interface CategoryChartProps {
  data: ServiceCategoryData[]
}

export function CategoryChart({ data }: CategoryChartProps) {
  return (
    <Card className="col-span-full md:col-span-1">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Serviços por Categoria</CardTitle>
        <CardDescription>Automotivo, Residencial e Comercial</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as ServiceCategoryData
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md text-xs">
                        <span className="font-semibold" style={{ color: item.color }}>
                          {item.name}: {item.value}%
                        </span>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 flex justify-center gap-4 text-xs">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-semibold text-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

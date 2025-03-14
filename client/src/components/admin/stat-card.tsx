import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  actionText: string;
  onAction: () => void;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  actionText, 
  onAction 
}: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-3xl font-medium mt-1">{value}</p>
          </div>
          <span className="material-icons text-primary-light">{icon}</span>
        </div>
        <div className="mt-4">
          <button 
            onClick={onAction}
            className="text-primary text-sm font-medium flex items-center hover:underline"
          >
            {actionText}
            <ArrowRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

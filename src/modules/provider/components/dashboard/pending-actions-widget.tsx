"use client";

import { AlertCircle, Clock, Calendar, Percent, Wrench, CheckCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface PendingAction {
  id: string;
  type: "booking" | "promotion" | "maintenance" | "notification";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  createdAt: Date;
  dueDate?: Date;
  facilityName?: string;
  customerName?: string;
  amount?: number;
  actionRequired: boolean;
}

interface PendingActionsWidgetProps {
  actions: PendingAction[];
  onActionClick?: (actionId: string) => void;
  onDismissAction?: (actionId: string) => void;
  onViewAll?: () => void;
}

export function PendingActionsWidget({
  actions = [],
  onActionClick,
  onDismissAction,
  onViewAll,
}: PendingActionsWidgetProps) {
  const t = useTranslations("ProviderModule.dashboard");

  const getActionIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Calendar className="h-4 w-4" />;
      case "promotion":
        return <Percent className="h-4 w-4" />;
      case "maintenance":
        return <Wrench className="h-4 w-4" />;
      case "notification":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "booking":
        return "text-blue-600";
      case "promotion":
        return "text-green-600";
      case "maintenance":
        return "text-orange-600";
      case "notification":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const isOverdue = (dueDate?: Date) => {
    if (!dueDate) return false;
    return new Date() > dueDate;
  };

  const highPriorityActions = actions.filter(action => action.priority === "high");
  const otherActions = actions.filter(action => action.priority !== "high");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
            Pending Actions
            {actions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {actions.length}
              </Badge>
            )}
          </CardTitle>
          {onViewAll && actions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
              <p className="text-sm">All caught up! No pending actions.</p>
            </div>
          ) : (
            <>
              {/* High Priority Actions */}
              {highPriorityActions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-red-600 uppercase tracking-wide">
                    High Priority
                  </div>
                  {highPriorityActions.slice(0, 2).map((action) => (
                    <ActionItem
                      key={action.id}
                      action={action}
                      onActionClick={onActionClick}
                      onDismissAction={onDismissAction}
                      getActionIcon={getActionIcon}
                      getPriorityColor={getPriorityColor}
                      getTypeColor={getTypeColor}
                      formatTimeAgo={formatTimeAgo}
                      isOverdue={isOverdue}
                    />
                  ))}
                </div>
              )}

              {/* Other Actions */}
              {otherActions.length > 0 && (
                <div className="space-y-2">
                  {highPriorityActions.length > 0 && (
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Other Actions
                    </div>
                  )}
                  {otherActions.slice(0, 3).map((action) => (
                    <ActionItem
                      key={action.id}
                      action={action}
                      onActionClick={onActionClick}
                      onDismissAction={onDismissAction}
                      getActionIcon={getActionIcon}
                      getPriorityColor={getPriorityColor}
                      getTypeColor={getTypeColor}
                      formatTimeAgo={formatTimeAgo}
                      isOverdue={isOverdue}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ActionItemProps {
  action: PendingAction;
  onActionClick?: (actionId: string) => void;
  onDismissAction?: (actionId: string) => void;
  getActionIcon: (type: string) => React.ReactNode;
  getPriorityColor: (priority: string) => string;
  getTypeColor: (type: string) => string;
  formatTimeAgo: (date: Date) => string;
  isOverdue: (dueDate?: Date) => boolean;
}

function ActionItem({
  action,
  onActionClick,
  onDismissAction,
  getActionIcon,
  getPriorityColor,
  getTypeColor,
  formatTimeAgo,
  isOverdue,
}: ActionItemProps) {
  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
        action.priority === "high" ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
      }`}
      onClick={() => onActionClick?.(action.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className={`${getTypeColor(action.type)} mt-0.5`}>
            {getActionIcon(action.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {action.title}
              </h4>
              <Badge className={getPriorityColor(action.priority)}>
                {action.priority}
              </Badge>
              {action.dueDate && isOverdue(action.dueDate) && (
                <Badge className="bg-red-100 text-red-800">
                  Overdue
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {action.description}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>{formatTimeAgo(action.createdAt)}</span>
                {action.facilityName && (
                  <span>• {action.facilityName}</span>
                )}
                {action.customerName && (
                  <span>• {action.customerName}</span>
                )}
                {action.amount && (
                  <span>• €{action.amount}</span>
                )}
              </div>
              {action.dueDate && (
                <span className={isOverdue(action.dueDate) ? "text-red-600" : ""}>
                  Due {action.dueDate.toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        {onDismissAction && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onDismissAction(action.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

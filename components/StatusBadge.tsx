interface StatusBadgeProps {
  status: 'success' | 'failure' | 'pending';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    success: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      border: 'border-green-500/30',
      icon: '✅',
      label: 'Success',
    },
    failure: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
      icon: '❌',
      label: 'Failed',
    },
    pending: {
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30',
      icon: '⏳',
      label: 'Pending',
    },
  };
  
  const { bg, text, border, icon, label } = config[status];
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text} border ${border}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
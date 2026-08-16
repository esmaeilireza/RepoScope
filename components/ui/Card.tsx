cat > components/Card.tsx <<'CARD_EOF'
import type { ReactNode } from 'react';

export default function Card({
  children,
  className = '',
  isStatic = false,
}: {
  children: ReactNode;
  className?: string;
  isStatic?: boolean;
}) {
  return (
    <div className={(isStatic ? 'card-static' : 'card') + ' rounded-2xl ' + className}>
      {children}
    </div>
  );
}
CARD_EOF

pnpm build

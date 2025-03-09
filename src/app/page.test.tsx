import { render, screen } from '@testing-library/react';
import Home from './page';

// Framer Motion コンポーネントをモック
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    __esModule: true,
    ...actual,
    motion: {
      div: ({ children, className, ...props }: any) => (
        <div className={className} data-testid="motion-div">{children}</div>
      ),
    },
  };
});

// Link コンポーネントをモック
jest.mock('next/link', () => {
  return ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid="next-link">{children}</a>
  );
});

describe('Home page', () => {
  it('renders the title correctly', () => {
    render(<Home />);
    
    expect(screen.getByText('PolyglotAI')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Language Speaking Practice')).toBeInTheDocument();
  });

  it('renders the feature cards', () => {
    render(<Home />);
    
    expect(screen.getByText('リアルタイム字幕')).toBeInTheDocument();
    expect(screen.getByText('間違いのハイライト')).toBeInTheDocument();
    expect(screen.getByText('発音練習')).toBeInTheDocument();
    expect(screen.getByText('進捗の記録')).toBeInTheDocument();
  });

  it('renders the practice button with correct link', () => {
    render(<Home />);
    
    const practiceButton = screen.getByText('練習を始める');
    expect(practiceButton).toBeInTheDocument();
    expect(practiceButton.closest('a')).toHaveAttribute('href', '/practice');
  });
}); 
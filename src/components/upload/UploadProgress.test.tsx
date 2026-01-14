/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UploadProgress } from './UploadProgress';

describe('UploadProgress', () => {
  it('should render progress percentage', () => {
    render(<UploadProgress progress={50} status="uploading" />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should render filename when provided', () => {
    render(
      <UploadProgress progress={30} status="uploading" filename="test-video.mp4" />
    );

    expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
  });

  it('should display idle status text', () => {
    render(<UploadProgress progress={0} status="idle" filename="test.mp4" />);

    expect(screen.getByText('待機中')).toBeInTheDocument();
  });

  it('should display uploading status text', () => {
    render(<UploadProgress progress={50} status="uploading" filename="test.mp4" />);

    // "アップロード中..." is displayed twice - once in status and once in progress area
    const elements = screen.getAllByText('アップロード中...');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should display processing status text', () => {
    render(<UploadProgress progress={100} status="processing" filename="test.mp4" />);

    expect(screen.getByText('処理中...')).toBeInTheDocument();
  });

  it('should display complete status text', () => {
    render(<UploadProgress progress={100} status="complete" filename="test.mp4" />);

    expect(screen.getByText('完了')).toBeInTheDocument();
  });

  it('should display error status and message', () => {
    render(
      <UploadProgress
        progress={50}
        status="error"
        filename="test.mp4"
        errorMessage="ファイルサイズが大きすぎます"
      />
    );

    expect(screen.getByText('エラー')).toBeInTheDocument();
    expect(screen.getByText('ファイルサイズが大きすぎます')).toBeInTheDocument();
  });

  it('should apply additional className', () => {
    const { container } = render(
      <UploadProgress progress={50} status="uploading" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should truncate long filenames', () => {
    render(
      <UploadProgress
        progress={50}
        status="uploading"
        filename="very-long-filename-that-should-be-truncated-for-display.mp4"
      />
    );

    const filenameElement = screen.getByText(
      'very-long-filename-that-should-be-truncated-for-display.mp4'
    );
    expect(filenameElement).toHaveClass('truncate');
  });
});

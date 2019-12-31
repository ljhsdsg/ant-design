import * as React from 'react';
import ResizeObserver from 'rc-resize-observer';
import omit from 'omit.js';
import classNames from 'classnames';
import calculateNodeHeight from './calculateNodeHeight';
import raf from '../_util/raf';
import warning from '../_util/warning';
import { TextAreaProps } from './TextArea';

export interface AutoSizeType {
  minRows?: number;
  maxRows?: number;
}

export interface TextAreaState {
  textareaStyles?: React.CSSProperties;
  /** We need add process style to disable scroll first and then add back to avoid unexpected scrollbar  */
  resizing?: boolean;
}

class ResizableTextArea extends React.Component<TextAreaProps, TextAreaState> {
  nextFrameActionId: number;

  resizeFrameId: number;

  constructor(props: TextAreaProps) {
    super(props);
    this.state = {
      textareaStyles: {},
      resizing: false,
    };
  }

  textArea: HTMLTextAreaElement;

  saveTextArea = (textArea: HTMLTextAreaElement) => {
    this.textArea = textArea;
  };

  componentDidMount() {
    this.resizeTextarea();
  }

  componentDidUpdate(prevProps: TextAreaProps) {
    // Re-render with the new content then recalculate the height as required.
    if (prevProps.value !== this.props.value) {
      this.resizeTextarea();
    }
  }

  handleResize = (size: { width: number; height: number }) => {
    const { autoSize, autosize, onResize } = this.props;
    if (typeof onResize === 'function') {
      onResize(size);
    }
    if (autoSize || autosize) {
      this.resizeOnNextFrame();
    }
  };

  resizeOnNextFrame = () => {
    raf.cancel(this.nextFrameActionId);
    this.nextFrameActionId = raf(this.resizeTextarea);
  };

  resizeTextarea = () => {
    const autoSize = this.props.autoSize || this.props.autosize;
    if (!autoSize || !this.textArea) {
      return;
    }
    const { minRows, maxRows } = autoSize as AutoSizeType;
    const textareaStyles = calculateNodeHeight(this.textArea, false, minRows, maxRows);
    this.setState({ textareaStyles, resizing: true }, () => {
      raf.cancel(this.resizeFrameId);
      this.resizeFrameId = raf(() => {
        this.setState({ resizing: false });
      });
    });
  };

  componentWillUnmount() {
    raf.cancel(this.nextFrameActionId);
    raf.cancel(this.resizeFrameId);
  }

  renderTextArea = () => {
    const { prefixCls, autoSize, autosize, onResize, className, disabled } = this.props;
    const { textareaStyles, resizing } = this.state;
    warning(
      autosize === undefined,
      'Input.TextArea',
      'autosize is deprecated, please use autoSize instead.',
    );
    const otherProps = omit(this.props, [
      'prefixCls',
      'onPressEnter',
      'autoSize',
      'autosize',
      'defaultValue',
      'allowClear',
      'onResize',
    ]);
    const cls = classNames(prefixCls, className, {
      [`${prefixCls}-disabled`]: disabled,
    });
    // Fix https://github.com/ant-design/ant-design/issues/6776
    // Make sure it could be reset when using form.getFieldDecorator
    if ('value' in otherProps) {
      otherProps.value = otherProps.value || '';
    }
    const style = {
      ...this.props.style,
      ...textareaStyles,
      ...(resizing ? { overflow: 'hidden' } : null),
    };
    return (
      <ResizeObserver onResize={this.handleResize} disabled={!(autoSize || autosize || onResize)}>
        <textarea {...otherProps} className={cls} style={style} ref={this.saveTextArea} />
      </ResizeObserver>
    );
  };

  render() {
    return this.renderTextArea();
  }
}

export default ResizableTextArea;
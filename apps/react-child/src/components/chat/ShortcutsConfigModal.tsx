import { useState, useCallback, useRef } from 'react';
import { Modal, Table, Button, Tag, Tooltip, message } from 'antd';
import { KeyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { configActions } from '../../store/configSlice';
import {
  eventToKeys,
  renderShortcutKeys,
  SHORTCUT_LABELS,
  DEFAULT_SHORTCUTS,
  type ShortcutActionId,
} from '../../utils/shortcuts';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsConfigModal({ open, onClose }: Props) {
  const dispatch = useDispatch();
  const shortcuts = useSelector((s: RootState) => s.config.shortcuts);
  const recordingRef = useRef<string | null>(null);
  const [recordingAction, setRecordingAction] = useState<string | null>(null);

  const handleKeyCapture = useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const keys = eventToKeys(e.nativeEvent);
      if (!keys) return;

      const actionId = recordingRef.current;
      if (!actionId) return;

      // 检查冲突：这个键组合是否已被其他动作使用
      for (const [otherId, otherKeys] of Object.entries(shortcuts)) {
        if (otherId !== actionId && otherKeys === keys) {
          message.warning(`该快捷键已被「${SHORTCUT_LABELS[otherId as ShortcutActionId]}」使用`);
          setRecordingAction(null);
          recordingRef.current = null;
          return;
        }
      }

      dispatch(configActions.setShortcut({ actionId: actionId as ShortcutActionId, keys }));
      setRecordingAction(null);
      recordingRef.current = null;
    },
    [dispatch, shortcuts],
  );

  const startRecording = useCallback((actionId: string) => {
    recordingRef.current = actionId;
    setRecordingAction(actionId);
  }, []);

  const resetAction = useCallback(
    (actionId: ShortcutActionId) => {
      dispatch(configActions.resetShortcut(actionId));
    },
    [dispatch],
  );

  const resetAll = useCallback(() => {
    dispatch(configActions.resetAllShortcuts());
    message.success('已恢复默认快捷键');
  }, [dispatch]);

  const columns = [
    {
      title: '操作',
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: '快捷键',
      key: 'keys',
      render: (_: any, record: { actionId: string; label: string }) => {
        const keys = shortcuts[record.actionId as ShortcutActionId];
        const isRecording = recordingAction === record.actionId;
        const isDefault = keys === DEFAULT_SHORTCUTS[record.actionId as ShortcutActionId];

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isRecording ? (
              <Tag color="blue" style={{ cursor: 'pointer', minWidth: 80, textAlign: 'center' }}>
                按下快捷键...
              </Tag>
            ) : (
              <Tooltip title="点击修改">
                <Tag
                  color="default"
                  style={{ cursor: 'pointer', fontFamily: 'monospace', fontSize: 13 }}
                  onClick={() => startRecording(record.actionId)}
                >
                  {renderShortcutKeys(keys)}
                </Tag>
              </Tooltip>
            )}
            {!isDefault && !isRecording && (
              <Tooltip title="恢复默认">
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined style={{ fontSize: 12 }} />}
                  onClick={() => resetAction(record.actionId as ShortcutActionId)}
                />
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  const dataSource = Object.entries(SHORTCUT_LABELS).map(([id, label]) => ({
    actionId: id,
    label,
    key: id,
  }));

  return (
    <Modal
      title={
        <span>
          <KeyOutlined style={{ marginRight: 8 }} />
          快捷键设置
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
            点击快捷键单元格即可录制新的组合键
          </span>
          <Button size="small" onClick={resetAll}>
            恢复全部默认
          </Button>
        </div>
      }
      width={480}
    >
      <div onKeyDown={handleKeyCapture} tabIndex={0} style={{ outline: 'none' }}>
        <Table
          columns={columns}
          dataSource={dataSource}
          size="small"
          pagination={false}
          rowKey="actionId"
        />
      </div>
    </Modal>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Drawer,
  Form,
  Input,
  Select,
  Slider,
  InputNumber,
  Radio,
  Button,
  Alert,
  Collapse,
  Space,
  message,
} from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import type { RootState } from '../../store';
import { configActions } from '../../store/configSlice';
import { uiActions } from '../../store/uiSlice';
import { fetchModels } from '../../services/modelFetcher';
import { ShortcutsConfigModal } from './ShortcutsConfigModal';
import type { APIProvider, CodeTheme } from '../../types/chat';
import { CODE_THEMES } from '../../constants/codeThemes';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: Props) {
  const dispatch = useDispatch();
  const config = useSelector((s: RootState) => s.config);
  const codeTheme = useSelector((s: RootState) => s.ui.codeTheme);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const fetchModelsIfNeeded = useCallback(async () => {
    if (config.provider === 'custom' || !config.apiKey) return;

    dispatch(configActions.setLoadingModels(true));
    try {
      const models = await fetchModels(config.baseUrl, config.apiKey, config.provider);
      dispatch(configActions.setFetchedModels(models));
      // Auto-select first model if none selected
      if (!config.defaultModel && models.length > 0) {
        dispatch(configActions.setDefaultModel(models[0].id));
        dispatch(uiActions.setSelectedModel(models[0].id));
      }
    } catch (err: any) {
      console.error('[modelFetcher] fetch failed:', err.message);
    } finally {
      dispatch(configActions.setLoadingModels(false));
    }
  }, [config.provider, config.baseUrl, config.apiKey, config.defaultModel, dispatch]);

  useEffect(() => {
    fetchModelsIfNeeded();
  }, [fetchModelsIfNeeded]);

  const modelOptions =
    config.provider === 'custom'
      ? []
      : config.fetchedModels.map((m) => ({ value: m.id, label: m.name }));
  const hasLoadedModels = config.fetchedModels.length > 0;

  const handleProviderChange = (provider: APIProvider) => {
    dispatch(configActions.setProvider(provider));
    // Clear selected model since it'll be set after models are fetched
    dispatch(uiActions.setSelectedModel(''));
  };

  const handleRefreshModels = () => {
    fetchModelsIfNeeded();
  };

  const handleTestConnection = async () => {
    if (!config.apiKey) {
      message.warning('请先输入 API Key');
      return;
    }
    try {
      const url = `${config.baseUrl.replace(/\/$/, '')}/models`;
      const headers: Record<string, string> = {
        Authorization: `Bearer ${config.apiKey}`,
      };
      if (config.provider === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin;
      }
      const res = await fetch(url, { headers });
      if (res.ok) {
        message.success('连接成功！');
      } else {
        message.error(`连接失败: ${res.status} ${res.statusText}`);
      }
    } catch (err: any) {
      message.error(`连接失败: ${err.message}`);
    }
  };

  const formContent = (
    <Form layout="vertical" size="small">
      <Form.Item label="API 提供商">
        <Radio.Group
          value={config.provider}
          onChange={(e) => handleProviderChange(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="openrouter">OpenRouter</Radio.Button>
          <Radio.Button value="openai">OpenAI</Radio.Button>
          <Radio.Button value="custom">Custom</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item label="API Base URL">
        <Input
          value={config.baseUrl}
          onChange={(e) => dispatch(configActions.setBaseUrl(e.target.value))}
          placeholder="https://api.example.com/v1"
        />
      </Form.Item>

      <Form.Item label="API Key">
        <Input.Password
          value={config.apiKey}
          onChange={(e) => dispatch(configActions.setApiKey(e.target.value))}
          placeholder="sk-..."
        />
      </Form.Item>

      {config.apiKey && (
        <Alert
          type="warning"
          showIcon
          message="安全提示"
          description="API Key 存储在浏览器的 localStorage 中。请勿在共享或公共电脑上使用。"
          style={{ marginBottom: 16 }}
        />
      )}

      <Form.Item label="默认模型">
        {config.provider === 'custom' ? (
          <Input
            value={config.defaultModel}
            onChange={(e) => {
              dispatch(configActions.setDefaultModel(e.target.value));
              dispatch(uiActions.setSelectedModel(e.target.value));
            }}
            placeholder="输入模型 ID"
          />
        ) : (
          <Select
            showSearch
            optionFilterProp="label"
            value={config.defaultModel}
            onChange={(val) => {
              dispatch(configActions.setDefaultModel(val));
              dispatch(uiActions.setSelectedModel(val));
            }}
            options={modelOptions}
            loading={config.isLoadingModels}
            placeholder={hasLoadedModels ? '选择模型' : config.apiKey ? '正在获取模型列表...' : '请先配置 API Key'}
            notFoundContent={config.apiKey ? '未找到可用模型' : null}
            style={{ width: '100%' }}
          />
        )}
      </Form.Item>

      {hasLoadedModels && config.provider !== 'custom' && (
        <Button
          type="link"
          size="small"
          onClick={handleRefreshModels}
          loading={config.isLoadingModels}
          style={{ marginTop: -8, marginBottom: 8 }}
        >
          刷新模型列表
        </Button>
      )}

      <Form.Item label="代码主题">
        <Select
          value={codeTheme}
          onChange={(val: CodeTheme) => dispatch(uiActions.setCodeTheme(val))}
          options={CODE_THEMES.map((t) => ({
            value: t.id,
            label: `${t.name}${t.style === 'light' ? ' ☀️' : ' 🌙'}`,
          }))}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item label="快捷键">
        <Button
          icon={<KeyOutlined />}
          onClick={() => setShortcutsOpen(true)}
          block
        >
          自定义快捷键
        </Button>
      </Form.Item>

      <Collapse
        ghost
        items={[
          {
            key: 'params',
            label: '高级参数',
            children: (
              <>
                <Form.Item label={`Temperature: ${config.temperature}`}>
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    value={config.temperature}
                    onChange={(val) => dispatch(configActions.setTemperature(val))}
                  />
                </Form.Item>
                <Form.Item label="Max Tokens">
                  <InputNumber
                    min={1}
                    max={128000}
                    value={config.maxTokens}
                    onChange={(val) => val && dispatch(configActions.setMaxTokens(val))}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label={`Top P: ${config.topP}`}>
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={config.topP}
                    onChange={(val) => dispatch(configActions.setTopP(val))}
                  />
                </Form.Item>
              </>
            ),
          },
        ]}
      />

      <Space style={{ marginTop: 16 }}>
        <Button type="primary" onClick={handleTestConnection}>
          测试连接
        </Button>
        {!config.apiKey && (
          <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
            未配置 API Key，使用 Mock 模式
          </span>
        )}
      </Space>
    </Form>
  );

  return (
    <Drawer
      title="API 设置"
      placement="right"
      width={420}
      open={open}
      onClose={onClose}
      extra={
        <Button size="small" onClick={() => dispatch(configActions.resetToDefaults())}>
          恢复默认
        </Button>
      }
    >
      {formContent}
      <ShortcutsConfigModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </Drawer>
  );
}

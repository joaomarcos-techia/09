import React, { useState } from 'react'
import { 
  X, 
  MessageCircle, 
  Mail, 
  Bot, 
  Key, 
  Globe, 
  Phone, 
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react'
import { useIntegrations } from '../../hooks/useIntegrations'

interface IntegrationSetupProps {
  isOpen: boolean
  onClose: () => void
  integrationType: 'whatsapp' | 'email' | 'ai'
}

export function IntegrationSetup({ isOpen, onClose, integrationType }: IntegrationSetupProps) {
  const { saveIntegration, testIntegration } = useIntegrations()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [whatsappConfig, setWhatsappConfig] = useState({
    apiKey: '',
    phoneNumber: '',
    webhookUrl: ''
  })

  const [emailConfig, setEmailConfig] = useState({
    smtpHost: '',
    smtpPort: '587',
    username: '',
    password: '',
    useSSL: true
  })

  const [aiConfig, setAiConfig] = useState({
    apiKey: '',
    model: 'gpt-3.5-turbo',
    systemPrompt: 'Você é um assistente de vendas profissional. Responda de forma útil e cordial.',
    maxTokens: 500,
    temperature: 0.7
  })

  if (!isOpen) return null

  const handleSave = async () => {
    setLoading(true)
    try {
      let config = {}
      
      switch (integrationType) {
        case 'whatsapp':
          config = whatsappConfig
          break
        case 'email':
          config = emailConfig
          break
        case 'ai':
          config = aiConfig
          break
      }

      const result = await saveIntegration(integrationType, config)
      
      if (result.success) {
        setTestResult({ success: true, message: 'Integração salva com sucesso!' })
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setTestResult({ success: false, message: result.error || 'Erro ao salvar integração' })
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Erro inesperado ao salvar' })
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const result = await testIntegration(integrationType)
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, message: 'Erro ao testar integração' })
    } finally {
      setTesting(false)
    }
  }

  const renderWhatsAppSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="text-green-600" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Configurar WhatsApp Business
        </h3>
        <p className="text-gray-600">
          Conecte sua conta do WhatsApp Business para enviar e receber mensagens
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Token da API do WhatsApp Business
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={whatsappConfig.apiKey}
              onChange={(e) => setWhatsappConfig({ ...whatsappConfig, apiKey: e.target.value })}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Insira seu token da API"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número do Telefone (ID)
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={whatsappConfig.phoneNumber}
              onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phoneNumber: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Ex: 5511999999999"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL do Webhook (opcional)
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="url"
              value={whatsappConfig.webhookUrl}
              onChange={(e) => setWhatsappConfig({ ...whatsappConfig, webhookUrl: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="https://seu-webhook.com/whatsapp"
            />
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-800 mb-2">Como obter as credenciais:</h4>
        <ol className="list-decimal list-inside text-sm text-green-700 space-y-1">
          <li>Acesse o <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">Facebook Developers</a></li>
          <li>Crie um app e configure o WhatsApp Business</li>
          <li>Obtenha o token de acesso permanente</li>
          <li>Configure o webhook para receber mensagens</li>
        </ol>
      </div>
    </div>
  )

  const renderEmailSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="text-blue-600" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Configurar Email
        </h3>
        <p className="text-gray-600">
          Configure sua conta de email para envio automático de mensagens
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servidor SMTP
            </label>
            <input
              type="text"
              value={emailConfig.smtpHost}
              onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="smtp.gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Porta
            </label>
            <input
              type="number"
              value={emailConfig.smtpPort}
              onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: e.target.value })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="587"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={emailConfig.username}
            onChange={(e) => setEmailConfig({ ...emailConfig, username: e.target.value })}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Senha ou App Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={emailConfig.password}
              onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
              className="w-full pr-12 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Sua senha"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={emailConfig.useSSL}
            onChange={(e) => setEmailConfig({ ...emailConfig, useSSL: e.target.checked })}
            className="mr-2"
          />
          <label className="text-sm text-gray-700">Usar SSL/TLS</label>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Configurações comuns:</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Gmail:</strong> smtp.gmail.com:587 (use App Password)</p>
          <p><strong>Outlook:</strong> smtp-mail.outlook.com:587</p>
          <p><strong>Yahoo:</strong> smtp.mail.yahoo.com:587</p>
        </div>
      </div>
    </div>
  )

  const renderAISetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bot className="text-purple-600" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Configurar Assistente de IA
        </h3>
        <p className="text-gray-600">
          Configure a IA para respostas automáticas inteligentes
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chave da API OpenAI
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={aiConfig.apiKey}
              onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="sk-..."
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modelo
          </label>
          <select
            value={aiConfig.model}
            onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prompt do Sistema
          </label>
          <textarea
            value={aiConfig.systemPrompt}
            onChange={(e) => setAiConfig({ ...aiConfig, systemPrompt: e.target.value })}
            rows={4}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Defina como a IA deve se comportar..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Tokens
            </label>
            <input
              type="number"
              value={aiConfig.maxTokens}
              onChange={(e) => setAiConfig({ ...aiConfig, maxTokens: parseInt(e.target.value) })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              min="100"
              max="2000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperatura (0-1)
            </label>
            <input
              type="number"
              step="0.1"
              value={aiConfig.temperature}
              onChange={(e) => setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              min="0"
              max="1"
            />
          </div>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-800 mb-2">Como obter a chave da API:</h4>
        <ol className="list-decimal list-inside text-sm text-purple-700 space-y-1">
          <li>Acesse <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a></li>
          <li>Faça login na sua conta OpenAI</li>
          <li>Vá em "API Keys" no menu</li>
          <li>Clique em "Create new secret key"</li>
          <li>Copie e cole a chave aqui</li>
        </ol>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Configurar Integração
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {integrationType === 'whatsapp' && renderWhatsAppSetup()}
          {integrationType === 'email' && renderEmailSetup()}
          {integrationType === 'ai' && renderAISetup()}

          {testResult && (
            <div className={`mt-6 p-4 rounded-lg border flex items-center ${
              testResult.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {testResult.success ? (
                <CheckCircle className="mr-3" size={20} />
              ) : (
                <AlertCircle className="mr-3" size={20} />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center"
            >
              {testing ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Testando...
                </>
              ) : (
                <>
                  <Settings className="mr-2" size={16} />
                  Testar Conexão
                </>
              )}
            </button>

            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Salvando...
                  </>
                ) : (
                  'Salvar Integração'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
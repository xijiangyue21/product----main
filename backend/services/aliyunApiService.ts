import axios from 'axios';

class AliyunApiService {
  private appKey: string;
  private appSecret: string;
  private endpoint: string;

  private appCode: string;

  constructor() {
    this.appKey = process.env.ALIYUN_API_APP_KEY || '';
    this.appSecret = process.env.ALIYUN_API_APP_SECRET || '';
    this.appCode = process.env.ALIYUN_API_APP_CODE || '';
    this.endpoint = process.env.ALIYUN_API_ENDPOINT || '';

    if (!this.appCode || !this.endpoint) {
      console.warn(
        '警告: 未设置 ALIYUN_API_APP_CODE 或 ALIYUN_API_ENDPOINT，行情相关接口将不可用（请在 .env 中配置，勿提交密钥到 Git）。'
      );
    }
  }

  private async request<T>(path: string, data: Record<string, string>, method: 'GET' | 'POST' = 'POST'): Promise<T> {
    if (!this.appCode || !this.endpoint) {
      throw new Error(
        '阿里云行情未配置：请在环境变量中设置 ALIYUN_API_APP_CODE 与 ALIYUN_API_ENDPOINT（密钥勿提交到 Git）。'
      );
    }
    try {
      // 构建表单参数
      const formData = Object.entries(data)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      const config: any = {
        method,
        url: `${this.endpoint}${path}`,
        headers: {
          'Authorization': `APPCODE ${this.appCode}`,
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      };

      if (method === 'GET') {
        config.params = data;
      } else {
        config.data = formData;
      }

      const response = await axios(config);
      return { data: response.data } as T;
    } catch (error) {
      console.error('阿里云 API 请求失败:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // 服务器返回错误状态码
          const status = error.response.status;
          const message = error.response.data?.message || error.response.statusText || '服务器返回错误';
          throw new Error(`API请求失败 (${status}): ${message}`);
        } else if (error.request) {
          // 请求已发送但没有收到响应
          throw new Error('API请求超时或网络连接失败');
        } else {
          // 请求配置出错
          throw new Error(`请求配置错误: ${error.message}`);
        }
      } else {
        // 其他错误
        throw new Error(`获取市场数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  }

  // 获取市场指数
  async getIndices(): Promise<{ data: any }> {
    return this.request<{ data: any }>('/stock/a/rank', {
      market: 'hs_a',
      sort: 'changeRate',
      asc: '0',
      pageNo: '1',
      pageSize: '10'
    });
  }

  // 获取股票行情
  async getStockQuote(code: string): Promise<{ data: any }> {
    return this.request<{ data: any }>('/stock/a/price', {
      symbol: code
    });
  }

  // 获取股票列表
  async getStocks(): Promise<{ data: any }> {
    return this.request<{ data: any }>('/stock/a/rank', {
      market: 'hs_a',
      sort: 'changeRate',
      asc: '0',
      pageNo: '1',
      pageSize: '100'
    });
  }

  // 获取行业板块
  async getSectors(): Promise<{ data: any }> {
    return this.request<{ data: any }>('/stock/a/rank', {
      market: 'hs_a',
      sort: 'changeRate',
      asc: '0',
      pageNo: '1',
      pageSize: '10'
    });
  }

  // 获取财经新闻
  async getNews(category?: string): Promise<{ data: any }> {
    return this.request<{ data: any }>('/stock/a/rank', {
      market: 'hs_a',
      sort: 'changeRate',
      asc: '0',
      pageNo: '1',
      pageSize: '10'
    });
  }

  // 获取股票基本面
  async getFundamentals(code: string): Promise<{ data: any }> {
    return this.request<{ data: any }>('/stock/a/rank', {
      market: 'hs_a',
      sort: 'changeRate',
      asc: '0',
      pageNo: '1',
      pageSize: '10'
    });
  }

  // 获取 K 线数据
  async getKline(code: string, period: string = '1d', limit: string = '60'): Promise<{ data: any }> {
    const typeMap: Record<string, string> = {
      '1d': '240',    // 日K
      '5d': '240',    // 日K
      '1m': '1',      // 1分钟
      '5m': '5',      // 5分钟
      '15m': '15',    // 15分钟
      '30m': '30',    // 30分钟
      '60m': '60'     // 60分钟
    };
    
    return this.request<{ data: any }>('/stock/a/kline', {
      symbol: code,
      type: typeMap[period] || '240',
      pageSize: limit
    });
  }

  // 获取A股排行
  async getStockRank(): Promise<{ data: any }> {
    return this.request<{ data: any }>('/stock/a/rank', {
      sort: 'changeRate',
      market: 'hs_a',
      asc: '0',
      pageNo: '1',
      pageSize: '5'
    });
  }
}

export default new AliyunApiService();
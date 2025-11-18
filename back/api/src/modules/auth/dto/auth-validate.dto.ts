export class AuthValidateResponse {
  success!: boolean;
  data?: {
    user: {
      id: string;
      company_id: string | null;
    };
    role: string;
    companyId: string | null;
  };
  error?: string;
  message?: string;
}

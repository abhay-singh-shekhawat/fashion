import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { loginUser, registerUser, logoutUser, verifyToken } from '../store/slices/authSlice';
import { LoginRequest, RegisterRequest } from '../types/user';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const login = async (credentials: LoginRequest) => {
    return dispatch(loginUser(credentials));
  };

  const register = async (userData: RegisterRequest) => {
    return dispatch(registerUser(userData));
  };

  const verify = async (token: string) => {
    return dispatch(verifyToken(token));
  };

  const logOut = () => {
    dispatch(logoutUser());
  };

  return {
    ...auth,
    login,
    register,
    verify,
    logOut,
  };
};

import { cookies } from "next/headers";

const cookieStore = await cookies();

export function getToken(): string | null {
    return localStorage.getItem("token");
}

export function setCookies(token: string, username: string, email: string, role: string): void {
    const cookieAll = JSON.stringify({
      token: token,
      username: username,
      email: email,
      role: role,
    });
    cookieStore.set("token", cookieAll, { 
      maxAge: 60 * 60 * 24, 
      secure: true, 
      httpOnly: true 
    });
}

export function setToken(token: string): void {
    localStorage.setItem("token", token);
}

export function removeToken(): void {
    localStorage.removeItem("token");
}
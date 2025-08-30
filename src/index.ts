export type User = {
  id: number;
  name: string;
  email: string;
};

export function doSomething(): void {
  const user: User = { id: 1, name: 'John Doe', email: 'tal@gmail.com' };

  console.log('user is:', user);
  console.log('package template');
}

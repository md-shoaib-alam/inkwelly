export interface Child {
  id: string;
  name: string;
  className: string;
  rollNumber: string;
  gender?: string;
}

export interface Parent {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  occupation?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  children?: Child[];
  username?: string;
}

export interface StudentMin {
  id: string;
  name: string;
  className: string;
  rollNumber: string;
}

export const getAvatarColor = (id: string) => {
  const colorsList = ['#FF9500', '#AF52DE', '#007AFF', '#34C759', '#FF3B30', '#5856D6', '#AF52DE'];
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return colorsList[sum % colorsList.length];
};

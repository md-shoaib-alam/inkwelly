export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
  createdAt: string;
}

// GraphQL Queries & Mutations
export const GET_ACADEMIC_YEARS = `
  query GetAcademicYears {
    academicYears {
      id
      name
      startDate
      endDate
      status
      isCurrent
      createdAt
    }
  }
`;

export const CREATE_ACADEMIC_YEAR = `
  mutation CreateAcademicYear($input: CreateAcademicYearInput!) {
    createAcademicYear(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_ACADEMIC_YEAR = `
  mutation UpdateAcademicYear($id: String!, $input: CreateAcademicYearInput!) {
    updateAcademicYear(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_ACADEMIC_YEAR = `
  mutation DeleteAcademicYear($id: String!) {
    deleteAcademicYear(id: $id)
  }
`;

export const SET_CURRENT_ACADEMIC_YEAR = `
  mutation SetCurrentAcademicYear($id: String!) {
    setCurrentAcademicYear(id: $id) {
      id
      name
    }
  }
`;

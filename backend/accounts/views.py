from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import RegisterSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view_api(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_account_view_api(request):
    user = request.user
    if not user.check_password(request.data.get("password", "")):
        return Response({"password": ["Mot de passe incorrect."]}, status=400)

    user.is_active = False
    user.set_unusable_password()
    user.save()
    return Response(status=204)